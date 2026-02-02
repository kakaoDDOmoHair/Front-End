import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { ScheduleCard } from "../../../components/dashboard/BossDashboard";
import { NOTIFICATIONS as INITIAL_NOTIFICATIONS } from "../../../components/notification/StaffData";
import api from "../../../constants/api";
import { useNotificationCount } from "../../../hooks/useNotificationCount";
import { styles } from "../../../styles/tabs/staff/Dashboard";

// --- 헬퍼 함수: Haversine 공식을 이용한 두 좌표 사이의 거리 계산 (m 단위) ---
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface DailyAttendanceItem {
  userId?: number;
  name?: string;
  status?: "ON" | "OFF" | "LATE" | "ABSENT";
  attendanceStatus?: string;
  workTime?: string;
  wage?: number;
}

interface TodoItem {
  id: number;
  text: string;
  isCompleted: boolean;
}

interface WeeklyScheduleApiItem {
  day: string;
  time: string;
  workers?: { scheduleId: number; name: string; breakTime: number }[];
}

interface WeeklyScheduleDay {
  day: string;
  schedules: { time: string; staff: string[] }[];
}

interface MonthlySummary {
  period: string;
  amount: number | null;
  totalHours: number | null;
  hourlyWage: number | null;
  year?: number;
  month?: number;
}

interface EstimatedSalary {
  period: string;
  amount: number | null;
  totalHours: number | null;
}


const normalizeWifiSsid = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const ssidMatch = raw.match(/ssid\s*:\s*([^|]+)/i);
  return (ssidMatch ? ssidMatch[1] : raw).trim();
};

const normalizeSsidForCompare = (value: string | null) => {
  if (!value) return "";
  const normalized = String(value)
    .replace(/^"+|"+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (
    !normalized ||
    normalized === "unknown ssid" ||
    normalized === "unknown" ||
    normalized === "연결됨" ||
    normalized === "null"
  ) {
    return "";
  }
  return normalized;
};

const RELAXED_DISTANCE_M = 300;
const ROUND_COMPARE_DECIMALS = 2;
const MIN_HOURLY_WAGE = 10320;
const roundCoord = (value: number, digits: number) => {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
};

const extractAttendanceIdFromResponse = (data: any) => {
  return (
    data?.attendanceId ??
    data?.attendance_id ??
    data?.attendanceID ??
    data?.data?.attendanceId ??
    data?.data?.attendance_id ??
    data?.data?.attendanceID ??
    data?.result?.attendanceId ??
    data?.result?.attendance_id ??
    null
  );
};

const toValidAttendanceId = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const safeGetWifiInfo = async () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require("react-native-network-info");
    const networkInfo = module?.NetworkInfo || module;
    if (networkInfo?.getSSID) {
      const ssid = await networkInfo.getSSID();
      const bssid = networkInfo.getBSSID ? await networkInfo.getBSSID() : null;
      return { ssid, bssid };
    }
  } catch (e) {
    // ignore
  }
  return { ssid: null, bssid: null };
};

const normalizeStoreInfo = (store: any) => {
  if (!store) return null;
  const nestedLocation = store.location || store.coordinate || store.coords;

  const lat =
    store.latitude ??
    store.lat ??
    store.storeLat ??
    store.storeLatitude ??
    store.store_latitude ??
    store.store_lat ??
    store.latitue ??
    store.y ??
    nestedLocation?.latitude ??
    nestedLocation?.lat ??
    nestedLocation?.y ??
    0;

  const lon =
    store.longitude ??
    store.lon ??
    store.storeLon ??
    store.storeLongitude ??
    store.store_longitude ??
    store.store_lon ??
    store.longtitude ??
    store.x ??
    nestedLocation?.longitude ??
    nestedLocation?.lon ??
    nestedLocation?.x ??
    0;

  const wifiSsid =
    store.wifiInfo ??
    store.wifi ??
    store.wifiSsid ??
    store.ssid ??
    store.wifi_name ??
    store.wifi_info ??
    nestedLocation?.wifiInfo ??
    "";

  return {
    lat: Number(lat) || 0,
    lon: Number(lon) || 0,
    wifiSsid: normalizeWifiSsid(wifiSsid),
  };
};

const StatusIndicator = ({
  icon,
  label,
  isActive,
}: {
  icon: any;
  label: string;
  isActive: boolean;
}) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
    <Ionicons name={icon} size={16} color={isActive ? "#34C759" : "#AFAFAF"} />
    <Text
      style={{
        fontSize: 13,
        color: isActive ? "#000" : "#AFAFAF",
        fontWeight: isActive ? "600" : "400",
      }}
    >
      {label}
    </Text>
  </View>
);

export default function DashboardScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const [userName, setUserName] = useState("직원");

  const [isWorking, setIsWorking] = useState(false);
  const [attendanceId, setAttendanceId] = useState<number | null>(null);

  const [bossStoreInfo, setBossStoreInfo] = useState({
    lat: 0,
    lon: 0,
    wifiSsid: "",
  });

  const [connectionStatus, setConnectionStatus] = useState({
    wifi: false,
    gps: false,
  });
  const [currentWifiName, setCurrentWifiName] = useState<string | null>(null);
  const [currentWifiBssid, setCurrentWifiBssid] = useState<string | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState("위치 확인 중...");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(
    null,
  );

  const [todoText, setTodoText] = useState("");
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [notifications] = useState(INITIAL_NOTIFICATIONS);
  const notificationCount = useNotificationCount("staff");

  const attendanceRequestRef = useRef(false);
  const [dailyAttendances, setDailyAttendances] = useState<
    DailyAttendanceItem[]
  >([]);
  const [todayStatus, setTodayStatus] = useState<
    "ON" | "OFF" | "LATE" | "ABSENT" | null
  >(null);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklyScheduleDay[]>(
    [],
  );
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(
    null,
  );
  const [contractHourlyWage, setContractHourlyWage] = useState<number | null>(
    null,
  );
  const [estimatedSalary, setEstimatedSalary] = useState<EstimatedSalary | null>(
    null,
  );
  const salaryRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [localSessionStart, setLocalSessionStart] = useState<number | null>(null);
  const [localSessionBaseHours, setLocalSessionBaseHours] = useState<number | null>(
    null,
  );
  const [localSessionBaseAmount, setLocalSessionBaseAmount] = useState<number | null>(
    null,
  );
  const [localPendingHours, setLocalPendingHours] = useState<number | null>(null);
  const [localPendingAmount, setLocalPendingAmount] = useState<number | null>(null);
  const localAccumKeyRef = useRef<string | null>(null);

  const loadCachedStoreInfo = async () => {
    try {
      const cached = await AsyncStorage.getItem("joinedStoreInfo");
      if (!cached) return null;
      const parsed = JSON.parse(cached);
      return normalizeStoreInfo(parsed);
    } catch (e) {
      return null;
    }
  };

  const parseNumber = (value: string | null) => {
    if (!value) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const getAuthHeader = async () => {
    try {
      const token = await AsyncStorage.getItem("user_token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
      return {};
    }
  };

  const getMonthlyAccumKey = (uid: number, storeId: number) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `staffLocalAccum:${uid}:${storeId}:${year}-${month}`;
  };

  const loadLocalAccum = async (uid: number, storeId: number) => {
    try {
      const key = getMonthlyAccumKey(uid, storeId);
      localAccumKeyRef.current = key;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const hours =
        parsed?.hours !== undefined ? Number(parsed.hours) : null;
      const amount =
        parsed?.amount !== undefined ? Number(parsed.amount) : null;
      if (Number.isFinite(hours)) setLocalPendingHours(hours);
      if (Number.isFinite(amount)) setLocalPendingAmount(amount);
    } catch (e) {
      // ignore
    }
  };

  const saveLocalAccum = async (hours: number | null, amount: number | null) => {
    try {
      const key = localAccumKeyRef.current;
      if (!key) return;
      if (hours == null && amount == null) {
        await AsyncStorage.removeItem(key);
        return;
      }
      await AsyncStorage.setItem(
        key,
        JSON.stringify({ hours, amount, savedAt: Date.now() }),
      );
    } catch (e) {
      // ignore
    }
  };

  const getWeekStartDate = () => {
    const now = new Date();
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day);
    return sunday.toISOString().split("T")[0];
  };

  const formatWorkHours = (hours: number | null | undefined) => {
    if (hours == null || !Number.isFinite(hours)) return "-";
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}시간 ${minutes}분`;
  };

  const parseDateValue = (value: any) => {
    if (!value) return null;
    const raw = String(value);
    const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const extractHourlyWage = (items: any[]) => {
    const pick = (val: any) => {
      const num = Number(val);
      return Number.isFinite(num) && num > 0 ? num : null;
    };
    for (const item of items) {
      const found =
        pick(item?.wage) ??
        pick(item?.hourlyWage) ??
        pick(item?.hourly_wage) ??
        pick(item?.payPerHour) ??
        pick(item?.pay_per_hour);
      if (found != null) return found;
    }
    return null;
  };

  const computeMonthlySummary = (
    items: any[],
    now: Date,
    fallbackWage: number | null,
    working: boolean,
    activeAttendanceId: number | null,
  ) => {
    let totalMs = 0;
    for (const item of items) {
      const start =
        parseDateValue(item?.startTime) ||
        parseDateValue(item?.checkInTime) ||
        parseDateValue(item?.check_in_time);
      if (!start) continue;
      const end =
        parseDateValue(item?.endTime) ||
        parseDateValue(item?.checkOutTime) ||
        parseDateValue(item?.check_out_time) ||
        null;
      if (end) {
        if (end.getTime() >= start.getTime()) {
          totalMs += end.getTime() - start.getTime();
        }
        continue;
      }

      const status = item?.status ?? item?.attendanceStatus ?? item?.state ?? null;
      const itemAttendanceId = toValidAttendanceId(
        item?.attendanceId ?? item?.attendance_id ?? item?.attendanceID ?? item?.id,
      );
      const isActiveRecord =
        working &&
        activeAttendanceId != null &&
        itemAttendanceId != null &&
        activeAttendanceId === itemAttendanceId;

      if (isActiveRecord) {
        if (now.getTime() >= start.getTime()) {
          totalMs += now.getTime() - start.getTime();
        }
        continue;
      }

      // endTime 없는 과거 기록은 누적에서 제외 (서버 오류 등으로 인한 과대 계산 방지)
      if (status === "ON" || status === "LATE") {
        // If backend forgot to close but user isn't working, skip.
      }
    }
    const totalHours = totalMs > 0 ? totalMs / 3600000 : 0;
    const hourlyWage = extractHourlyWage(items) ?? fallbackWage ?? null;
    const amount =
      hourlyWage != null ? Math.floor(totalHours * hourlyWage) : null;
    return { totalHours, hourlyWage, amount };
  };

  const dayOrder = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayLabelMap: Record<string, string> = {
    SUN: "일",
    MON: "월",
    TUE: "화",
    WED: "수",
    THU: "목",
    FRI: "금",
    SAT: "토",
  };

  const fetchDailyAttendances = async (storeId: number, uid: number) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get("/api/v1/attendances/daily", {
        params: { storeId, date: today },
      });
      // 백엔드: 객체 응답 시 data.data가 리스트, 배열이면 그대로
      const payload = response.data?.data ?? response.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.list ?? payload?.attendances ?? payload?.items ?? [];
      const normalized = Array.isArray(list) ? list : [];
      const myItems = normalized.filter(
        (item: any) =>
          item?.userId === uid ||
          item?.user_id === uid ||
          item?.workerId === uid,
      );
      setDailyAttendances(myItems);
      const my = myItems[0];
      const status =
        my?.status || my?.attendanceStatus || my?.state || my?.attendance_state;
      setTodayStatus(status || null);
      // daily에 attendanceId 있으면 출근중 복원 시 참고 (선택)
      const myAid = my?.attendanceId ?? my?.attendance_id ?? my?.id;
      if (myAid != null && (status === "ON" || status === "LATE")) {
        const idNum = toValidAttendanceId(myAid);
        if (idNum) {
          setAttendanceId(idNum);
          await AsyncStorage.setItem("attendanceId", String(idNum));
        }
      }
    } catch (e) {
      setDailyAttendances([]);
      setTodayStatus(null);
    }
  };

  const fetchWeeklySchedules = async (storeId: number) => {
    try {
      const startDate = getWeekStartDate();
      const response = await api.get("/api/v1/schedules/weekly", {
        params: { storeId, startDate },
      });
      const payload = response.data?.data || response.data;
      const list: WeeklyScheduleApiItem[] = Array.isArray(payload)
        ? payload
        : payload?.list || payload?.items || [];

      const grouped = dayOrder.map((day) => {
        const items = list.filter((item) => item.day === day);
        return {
          day: dayLabelMap[day] || day,
          schedules: items.map((item) => ({
            time: item.time,
            staff: (item.workers || []).map((w) => w.name),
          })),
        };
      });
      setWeeklySchedules(grouped);
    } catch (e) {
      setWeeklySchedules(
        dayOrder.map((day) => ({ day: dayLabelMap[day] || day, schedules: [] })),
      );
    }
  };

  const fetchContractWage = async (storeId: number, uid: number) => {
    try {
      const headers = await getAuthHeader();
      const response = await api.get("/api/v1/contracts", {
        params: { storeId, page: 0, size: 50 },
        headers,
      });
      const payload = response.data?.data ?? response.data;
      const content = payload?.content || payload?.list || payload?.items || [];
      const list = Array.isArray(content) ? content : [];
      const nameKey = String(userName || "").trim();
      const match = list.find(
        (c: any) =>
          c?.userId === uid ||
          c?.workerId === uid ||
          c?.worker_id === uid,
      ) ??
        (nameKey
          ? list.find(
              (c: any) =>
                String(c?.workerName || "").trim() === nameKey ||
                String(c?.name || "").trim() === nameKey,
            )
          : null);
      const contractId = match?.contractId ?? match?.id ?? null;
      let wage =
        Number(match?.wage) ||
        Number(match?.hourlyWage) ||
        Number(match?.hourly_wage) ||
        null;

      if (contractId) {
        try {
          const detailRes = await api.get(`/api/v1/contracts/${contractId}`, {
            headers,
          });
          const detail = detailRes.data?.data ?? detailRes.data;
          const detailWage =
            Number(detail?.wage) ||
            Number(detail?.hourlyWage) ||
            Number(detail?.hourly_wage) ||
            null;
          if (detailWage != null && Number.isFinite(detailWage)) {
            wage = detailWage;
          }
        } catch (e) {
          // ignore detail fallback
        }
      }

      setContractHourlyWage(Number.isFinite(wage as number) ? wage : null);
    } catch (e) {
      setContractHourlyWage(null);
    }
  };

  const fetchMonthlySummary = async (uid: number) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const response = await api.get("/api/v1/attendances/monthly", {
        params: { userId: uid, year, month },
      });
      const payload = response.data?.data ?? response.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.data || payload?.list || payload?.items || [];
      const fallbackWage =
        extractHourlyWage(dailyAttendances) ??
        extractHourlyWage(list) ??
        contractHourlyWage;
      const summary = computeMonthlySummary(
        list,
        now,
        fallbackWage,
        isWorking,
        toValidAttendanceId(attendanceId),
      );
      setMonthlySummary({
        period: `${year}년 ${month}월`,
        amount: summary.amount,
        totalHours: summary.totalHours,
        hourlyWage: summary.hourlyWage,
        year,
        month,
      });
    } catch (e) {
      setMonthlySummary(null);
    }
  };

  const fetchEstimatedSalary = async (storeId: number, uid: number) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const headers = await getAuthHeader();
      const response = await api.get("/api/v1/salary/estimated", {
        params: { storeId, userId: uid, year, month },
        headers,
      });
      const payload = response.data?.data ?? response.data;
      const amount =
        payload?.amount !== undefined ? Number(payload.amount) : null;
      const totalHours =
        payload?.totalHours !== undefined ? Number(payload.totalHours) : null;
      setEstimatedSalary({
        period: payload?.period || `${year}.${String(month).padStart(2, "0")}.01~`,
        amount: Number.isFinite(amount as number) ? amount : null,
        totalHours: Number.isFinite(totalHours as number) ? totalHours : null,
      });
    } catch (e) {
      setEstimatedSalary(null);
    }
  };


  const refreshSalaryViews = async (storeId: number, uid: number) => {
    const runRefresh = async () => {
      fetchMonthlySummary(uid);
      await fetchEstimatedSalary(storeId, uid);
    };

    // 1) 즉시 반영 시도
    await runRefresh();

    // 2) 서버 반영 지연 대비 재조회 (최대 3회)
    if (salaryRefreshTimeoutRef.current) {
      clearTimeout(salaryRefreshTimeoutRef.current);
    }
    let attempts = 0;
    const scheduleRetry = (delayMs: number) => {
      salaryRefreshTimeoutRef.current = setTimeout(async () => {
        attempts += 1;
        await runRefresh();
        if (attempts < 3) {
          scheduleRetry(3000);
        }
      }, delayMs);
    };
    scheduleRetry(1500);
  };

  // ✅ 출근 상태/attendanceId 복원: attendanceId가 있을 때만 근무중으로 복원
  const restoreWorkingFromStorage = async () => {
    const storedAttendanceId = await AsyncStorage.getItem("attendanceId");
    if (storedAttendanceId) {
      const idNum = Number(storedAttendanceId);
      if (Number.isFinite(idNum) && idNum > 0) {
        setAttendanceId(idNum);
        setIsWorking(true);
        return;
      }
    }
    setAttendanceId(null);
    setIsWorking(false);
  };

  // ✅ 서버에서 현재 출근중(ON/LATE) record를 찾아 attendanceId 동기화 (monthly로 대체)
  const syncWorkingFromServerByMonthly = async (uid: number) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const res = await api.get("/api/v1/attendances/monthly", {
        params: { userId: uid, year, month },
      });

      const payload = res.data?.data || res.data;
      const list = Array.isArray(payload)
        ? payload
        : payload?.data?.list ||
          payload?.data?.items ||
          payload?.data ||
          payload?.list ||
          payload?.items ||
          [];

      if (!Array.isArray(list)) return null;
      if (list.length === 0) {
        setAttendanceId(null);
        setIsWorking(false);
        await AsyncStorage.removeItem("attendanceId");
        return null;
      }

      // AttendanceDto.AttendanceLog: { attendanceId, startTime, endTime, status, ... }
      // 출근중 후보: status=ON/LATE AND endTime is null
      const candidates = list
        .map((x: any) => ({
          attendanceId:
            x?.attendanceId ??
            x?.attendance_id ??
            x?.attendanceID ??
            x?.id ??
            null,
          status: x?.status ?? x?.attendanceStatus ?? x?.state ?? null,
          endTime:
            x?.endTime ??
            x?.end_time ??
            x?.checkOutTime ??
            x?.check_out_time ??
            x?.checkoutTime ??
            x?.checkout_time ??
            null,
          startTime:
            x?.startTime ??
            x?.start_time ??
            x?.checkInTime ??
            x?.check_in_time ??
            null,
        }))
        .filter((x: any) => x.attendanceId != null);

      const on = candidates.find((x: any) => (x.status === "ON" || x.status === "LATE") && !x.endTime);

      if (on?.attendanceId) {
        const idNum = toValidAttendanceId(on.attendanceId);
        if (idNum) {
          setAttendanceId(idNum);
          setIsWorking(true);
          await AsyncStorage.setItem("attendanceId", String(idNum));
          return idNum;
        }
      }
      setAttendanceId(null);
      setIsWorking(false);
      await AsyncStorage.removeItem("attendanceId");
    } catch (e) {
      // ignore best-effort
    }
    return null;
  };

  const initializeDashboard = async () => {
    try {
      setIsLoading(true);

      const username = await AsyncStorage.getItem("username");
      const storedUserId = parseNumber(await AsyncStorage.getItem("userId"));
      const storedStoreId = parseNumber(await AsyncStorage.getItem("storeId"));

      if (!username) {
        if (storedUserId) setUserId(storedUserId);
        if (storedStoreId) setCurrentStoreId(storedStoreId);
        await restoreWorkingFromStorage();
        if (storedUserId) await syncWorkingFromServerByMonthly(storedUserId);
        return;
      }

      const response = await api.get("/api/v1/users/me", { params: { username } });
      const data = response.data?.data || response.data;

      const resolvedUserId = data?.userId || storedUserId;
      const resolvedStoreId =
        data?.storeId ||
        data?.store?.storeId ||
        data?.storeInfo?.storeId ||
        data?.store_info?.storeId ||
        storedStoreId;

      if (resolvedUserId) setUserId(resolvedUserId);
      setUserName(data?.name || "직원");
      if (resolvedStoreId) setCurrentStoreId(resolvedStoreId);

      // 출근상태: 로컬 복원 후, 서버로 재동기화(best-effort)
      await restoreWorkingFromStorage();
      if (resolvedUserId) await syncWorkingFromServerByMonthly(resolvedUserId);

      // 매장 정보
      const storePayload = data?.store || data?.storeInfo || data?.store_info;
      const normalized = normalizeStoreInfo(storePayload) || normalizeStoreInfo(data);
      if (normalized) setBossStoreInfo(normalized);
      else {
        const cachedInfo = await loadCachedStoreInfo();
        if (cachedInfo) setBossStoreInfo(cachedInfo);
      }
      if (resolvedStoreId && resolvedUserId) {
        fetchDailyAttendances(resolvedStoreId, resolvedUserId);
        fetchWeeklySchedules(resolvedStoreId);
        fetchContractWage(resolvedStoreId, resolvedUserId);
        fetchEstimatedSalary(resolvedStoreId, resolvedUserId);
        loadLocalAccum(resolvedUserId, resolvedStoreId);
      }
      if (resolvedUserId) {
        fetchMonthlySummary(resolvedUserId);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      initializeDashboard();
    }, []),
  );

  // 실시간 기기 상태 체크
  const checkRealtimeStatus = async () => {
    try {
      const netState = await Network.getNetworkStateAsync();
      const isWifi = netState.type === Network.NetworkStateType.WIFI;

      if (isWifi) {
        const { ssid, bssid } = await safeGetWifiInfo();
        setCurrentWifiName(ssid && ssid !== "unknown ssid" ? ssid : null);
        setCurrentWifiBssid(bssid || null);
      } else {
        setCurrentWifiName(null);
        setCurrentWifiBssid(null);
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      const isGpsEnabled = await Location.hasServicesEnabledAsync();

      if (status === "granted" && isGpsEnabled) {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });

        const addr = await Location.reverseGeocodeAsync(loc.coords);
        if (addr.length > 0) {
          const a = addr[0];
          setCurrentLocationName(
            `${a.district || ""} ${a.street || ""}`.trim() || "위치 확인 완료",
          );
        }
        setConnectionStatus({ wifi: isWifi, gps: true });
      } else {
        setConnectionStatus({ wifi: isWifi, gps: false });
        setCurrentLocationName(isGpsEnabled ? "권한 없음" : "GPS 꺼짐");
        setCurrentCoords(null);
      }
    } catch (e) {
      console.log("상태 체크 오류");
    }
  };

  useEffect(() => {
    checkRealtimeStatus();
    const interval = setInterval(checkRealtimeStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // 근무 중에는 이번 달 누적 금액을 주기적으로 갱신
  useEffect(() => {
    if (!isWorking || !userId) return;
    const interval = setInterval(() => {
      fetchMonthlySummary(userId);
      if (currentStoreId) fetchEstimatedSalary(currentStoreId, userId);
    }, 60000);
    return () => clearInterval(interval);
  }, [isWorking, userId, currentStoreId]);

  useEffect(() => {
    return () => {
      if (salaryRefreshTimeoutRef.current) {
        clearTimeout(salaryRefreshTimeoutRef.current);
      }
    };
  }, []);

  const displayHourlyWage =
    monthlySummary?.hourlyWage ?? contractHourlyWage ?? null;
  const inferredHourlyWage =
    estimatedSalary?.amount != null &&
    estimatedSalary?.totalHours != null &&
    estimatedSalary.totalHours > 0
      ? estimatedSalary.amount / estimatedSalary.totalHours
      : null;
  const effectiveHourlyWage =
    displayHourlyWage ??
    (inferredHourlyWage != null && Number.isFinite(inferredHourlyWage)
      ? inferredHourlyWage
      : null);
  const appliedHourlyWage = Math.max(
    MIN_HOURLY_WAGE,
    effectiveHourlyWage ?? MIN_HOURLY_WAGE,
  );
  const estimatedHasValue =
    (estimatedSalary?.totalHours ?? 0) > 0 ||
    (estimatedSalary?.amount ?? 0) > 0;
  const displayTotalHours = estimatedHasValue
    ? estimatedSalary?.totalHours ?? null
    : monthlySummary?.totalHours ?? null;
  const displayAmount = estimatedHasValue
    ? estimatedSalary?.amount ?? null
    : monthlySummary?.amount ??
      (displayHourlyWage != null && displayTotalHours != null
        ? Math.floor(displayTotalHours * displayHourlyWage)
        : null);
  const nowTimestamp = Date.now();
  const elapsedMinutes =
    localSessionStart != null
      ? Math.floor((nowTimestamp - localSessionStart) / 60000)
      : 0;
  const elapsedHours = elapsedMinutes / 60;
  const perMinuteWage = Number.isFinite(appliedHourlyWage)
    ? appliedHourlyWage / 60
    : null;
  const optimisticBaseHours =
    localSessionBaseHours ?? displayTotalHours ?? 0;
  const optimisticWorkingHours =
    isWorking && localSessionStart != null
      ? optimisticBaseHours + elapsedHours
      : null;
  const optimisticWorkingAmount =
    isWorking &&
    localSessionStart != null &&
    perMinuteWage != null
      ? Math.floor(
          (localSessionBaseAmount ?? 0) + elapsedMinutes * perMinuteWage,
        )
      : null;
  const finalDisplayHours =
    optimisticWorkingHours ??
    (localPendingHours != null
      ? Math.max(localPendingHours, displayTotalHours ?? 0)
      : displayTotalHours);
  const fallbackAmountFromHours =
    finalDisplayHours != null &&
    Number.isFinite(appliedHourlyWage)
      ? Math.floor(finalDisplayHours * appliedHourlyWage)
      : null;
  const finalDisplayAmount =
    optimisticWorkingAmount ??
    (localPendingAmount != null
      ? Math.max(localPendingAmount, displayAmount ?? 0)
      : displayAmount ?? fallbackAmountFromHours);

  useEffect(() => {
    saveLocalAccum(localPendingHours, localPendingAmount);
  }, [localPendingHours, localPendingAmount]);

  useEffect(() => {
    if (
      localPendingHours != null &&
      displayTotalHours != null &&
      displayTotalHours >= localPendingHours - 0.01
    ) {
      setLocalPendingHours(null);
    }
    if (
      localPendingAmount != null &&
      displayAmount != null &&
      displayAmount >= localPendingAmount
    ) {
      setLocalPendingAmount(null);
    }
  }, [displayTotalHours, displayAmount, localPendingHours, localPendingAmount]);

  useEffect(() => {
    if (!userId) return;
    if (contractHourlyWage == null) return;
    fetchMonthlySummary(userId);
  }, [contractHourlyWage, userId]);

  const handleAttendance = async () => {
    if (attendanceRequestRef.current) return;
    attendanceRequestRef.current = true;

    if (!currentStoreId || !userId) {
      attendanceRequestRef.current = false;
      return Alert.alert("알림", "정보를 불러오는 중입니다.");
    }

    try {
      setIsLoading(true);

      const storeInfo = bossStoreInfo;
      const hasWifiInfo = Boolean(storeInfo.wifiSsid);
      const hasLocationInfo = storeInfo.lat !== 0 || storeInfo.lon !== 0;
      const hasStoreInfo = hasWifiInfo || hasLocationInfo;

      const isAndroid = Platform.OS === "android";
      const shouldUseWifiOnly = isAndroid && hasWifiInfo;
      let lat = currentCoords?.lat ?? null;
      let lon = currentCoords?.lon ?? null;

      if (!shouldUseWifiOnly) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setIsLoading(false);
          attendanceRequestRef.current = false;
          return Alert.alert("권한 필요", "위치 권한을 허용해 주세요.");
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
      } else {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        } catch (e) {
          // WiFi 기반 인증이므로 위치는 best-effort
        }

        if (lat == null || lon == null) {
          lat = storeInfo.lat || 0;
          lon = storeInfo.lon || 0;
        }
      }

      const netState = await Network.getNetworkStateAsync();
      const isWifi = netState.type === Network.NetworkStateType.WIFI;
      const wifiInfo = isWifi ? await safeGetWifiInfo() : { ssid: null, bssid: null };
      const ssid = wifiInfo.ssid;
      const bssid = wifiInfo.bssid;

      if (hasStoreInfo) {
        const distance =
          !shouldUseWifiOnly && hasLocationInfo && lat != null && lon != null
            ? getDistance(lat, lon, storeInfo.lat, storeInfo.lon)
            : null;

        const swappedDistance =
          !shouldUseWifiOnly && hasLocationInfo && lat != null && lon != null
            ? getDistance(lat, lon, storeInfo.lon, storeInfo.lat)
            : null;

        const effectiveDistance =
          distance !== null && swappedDistance !== null
            ? Math.min(distance, swappedDistance)
            : distance ?? swappedDistance;

        const normalizedCurrentSsid = normalizeSsidForCompare(ssid);
        const normalizedStoreSsid = normalizeSsidForCompare(storeInfo.wifiSsid);

        const isWifiMatched =
          hasWifiInfo &&
          Boolean(normalizedCurrentSsid) &&
          Boolean(normalizedStoreSsid) &&
          (normalizedCurrentSsid === normalizedStoreSsid ||
            normalizedCurrentSsid.includes(normalizedStoreSsid) ||
            normalizedStoreSsid.includes(normalizedCurrentSsid));

        const isLocationMatched =
          !shouldUseWifiOnly &&
          hasLocationInfo &&
          effectiveDistance !== null &&
          effectiveDistance <= RELAXED_DISTANCE_M;

        const isRoundedLocationMatched =
          !shouldUseWifiOnly &&
          hasLocationInfo &&
          lat != null &&
          lon != null &&
          roundCoord(lat, ROUND_COMPARE_DECIMALS) ===
            roundCoord(storeInfo.lat, ROUND_COMPARE_DECIMALS) &&
          roundCoord(lon, ROUND_COMPARE_DECIMALS) ===
            roundCoord(storeInfo.lon, ROUND_COMPARE_DECIMALS);

        if (
          (!shouldUseWifiOnly && !isWifiMatched && !isLocationMatched && !isRoundedLocationMatched) ||
          (shouldUseWifiOnly && !isWifiMatched)
        ) {
          setIsLoading(false);
          attendanceRequestRef.current = false;
          return Alert.alert(
            "매장 인증 실패",
            `매장 내에서만 출퇴근이 가능합니다.\n\n현재 WiFi: ${ssid || "미연결"}\n매장 WiFi: ${storeInfo.wifiSsid || "정보 없음"}\n매장과의 거리: ${effectiveDistance !== null ? `약 ${Math.round(effectiveDistance)}m` : "위치 정보 없음"}`,
          );
        }
      } else {
        Alert.alert(
          "매장 정보 없음",
          `매장 위치/와이파이 정보가 없습니다.\n(storeId: ${currentStoreId})\n검증 없이 출근을 진행합니다.`,
        );
      }

      if (!isWorking) {
        // 출근 — 실제 버튼 누른 시각을 clockedAt(UTC ISO)로 전달해 기록이 그 시각으로 저장되도록 함
        const clockedAt = new Date().toISOString();
        const response = await api.post("/api/v1/attendances/clock-in", {
          storeId: currentStoreId,
          userId,
          lat: lat ?? 0,
          lon: lon ?? 0,
          wifiBssid: bssid || ssid || "",
          clockedAt,
        });

        const newId = extractAttendanceIdFromResponse(response?.data);
        // 백엔드: 지각 시 status "LATE", 정상 시 "ON" 반환 (한국 시간 기준 판단)
        const resStatus = (response?.data?.status ?? response?.data?.data?.status ?? "ON") as string;
        const normalizedStatus = String(resStatus).toUpperCase() === "LATE" ? "LATE" : "ON";
        setTodayStatus(normalizedStatus);

        if (__DEV__) {
          console.log("[clock-in] 응답 전체 response.data:", JSON.stringify(response?.data, null, 2));
          console.log("[clock-in] status(원본):", resStatus, "→ 화면 표시:", normalizedStatus === "LATE" ? "지각(근무중)" : "정상출근");
        }

        if (newId) {
          const idNum = Number(newId);
          setAttendanceId(idNum);
          setIsWorking(true);
          await AsyncStorage.setItem("attendanceId", String(idNum));
          const baseHours = Math.max(displayTotalHours ?? 0, localPendingHours ?? 0);
          const baseAmount = Math.max(displayAmount ?? 0, localPendingAmount ?? 0);
          setLocalSessionStart(Date.now());
          setLocalSessionBaseHours(baseHours);
          setLocalSessionBaseAmount(baseAmount);
          setLocalPendingHours(baseHours);
          setLocalPendingAmount(baseAmount);
          Alert.alert("출근 완료", "오늘도 즐거운 근무 되세요!");
        } else {
          Alert.alert("알림", "출근은 처리됐지만 attendanceId를 받지 못했습니다.");
        }
        if (userId) {
          if (currentStoreId) {
            refreshSalaryViews(currentStoreId, userId);
          } else {
            fetchMonthlySummary(userId);
          }
        }
      } else {
        // 퇴근: ✅ attendanceId를 로컬 변수로 확정해서 보냄 (state 지연/null 방지)
        let aid: number | null = toValidAttendanceId(attendanceId);
        if (!aid) {
          const storedAttendanceId = await AsyncStorage.getItem("attendanceId");
          aid = toValidAttendanceId(storedAttendanceId);
        }

        if (!aid) {
          // 서버로 best-effort 동기화 시도 (monthly)
          aid = await syncWorkingFromServerByMonthly(userId);
        }
        if (!aid && userId) {
          // 퇴근 전 attendanceId 복구: 현재 출근 중 API 사용
          try {
            const currentRes = await api.get("/api/v1/attendances/current", {
              params: { userId },
            });
            const currentAid = currentRes?.data?.attendanceId ?? null;
            aid = toValidAttendanceId(currentAid);
          } catch (_e) {
            // 무시 후 아래 알림으로 진행
          }
        }

        if (!aid) {
          setIsWorking(false);
          setAttendanceId(null);
          await AsyncStorage.removeItem("attendanceId");
          setIsLoading(false);
          attendanceRequestRef.current = false;
          return Alert.alert(
            "알림",
            "퇴근 처리할 출근 기록 ID가 없습니다.\n(서버에서 출근중 ID도 찾지 못함)\n앱 재실행 후 다시 시도해주세요.",
          );
        }

        // 퇴근 — 실제 버튼 누른 시각을 clockedAt(UTC ISO)로 전달해 기록이 그 시각으로 저장되도록 함
        const clockedAt = new Date().toISOString();
        await api.post("/api/v1/attendances/clock-out", {
          attendanceId: aid,
          attendance_id: aid,
          userId,
          storeId: currentStoreId,
          lat: lat ?? 0,
          lon: lon ?? 0,
          clockedAt,
        });

        if (localSessionStart != null && localSessionBaseHours != null) {
          const workedMinutes = Math.floor(
            (Date.now() - localSessionStart) / 60000,
          );
          const workedHours = localSessionBaseHours + workedMinutes / 60;
          setLocalPendingHours(workedHours);
          if (Number.isFinite(appliedHourlyWage)) {
            const perMinute = appliedHourlyWage / 60;
            setLocalPendingAmount(
              Math.floor((localSessionBaseAmount ?? 0) + workedMinutes * perMinute),
            );
          } else if (localSessionBaseAmount != null) {
            setLocalPendingAmount(localSessionBaseAmount);
          }
        }
        setLocalSessionStart(null);
        setLocalSessionBaseHours(null);
        setLocalSessionBaseAmount(null);

        setIsWorking(false);
        setAttendanceId(null);
        await AsyncStorage.removeItem("attendanceId");
        Alert.alert("퇴근 완료", "오늘도 고생 많으셨습니다!");
        if (userId) {
          if (currentStoreId) {
            refreshSalaryViews(currentStoreId, userId);
          } else {
            fetchMonthlySummary(userId);
          }
        }
      }
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || "";

      // 이미 출근이면: 서버에서 attendanceId를 monthly로 찾아 동기화
      if (error?.response?.status === 500 && serverMessage.includes("이미 출근")) {
        await syncWorkingFromServerByMonthly(userId!);
        setIsWorking(true);
        Alert.alert("안내", "이미 출근 상태입니다. 상태를 동기화했습니다.");
        return;
      }

      if (error?.response?.status === 500 && serverMessage.includes("이미 퇴근")) {
        setIsWorking(false);
        setAttendanceId(null);
        await AsyncStorage.removeItem("attendanceId");
        Alert.alert("안내", "이미 퇴근 상태입니다. 상태를 동기화했습니다.");
        return;
      }

      Alert.alert("알림", serverMessage || "출퇴근 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      attendanceRequestRef.current = false;
    }
  };

  const isInZone = useMemo(() => {
    const hasWifiInfo = Boolean(bossStoreInfo.wifiSsid);
    const hasLocationInfo = bossStoreInfo.lat !== 0 || bossStoreInfo.lon !== 0;
    const hasStoreInfo = hasWifiInfo || hasLocationInfo;

    const wifiMatch = hasWifiInfo
      ? normalizeSsidForCompare(currentWifiName) === normalizeSsidForCompare(bossStoreInfo.wifiSsid)
      : false;

    if (!hasStoreInfo) return connectionStatus.gps;

    if (!currentCoords) return wifiMatch || false;

    const distance = getDistance(currentCoords.lat, currentCoords.lon, bossStoreInfo.lat, bossStoreInfo.lon);
    const swappedDistance = getDistance(currentCoords.lat, currentCoords.lon, bossStoreInfo.lon, bossStoreInfo.lat);
    const effectiveDistance = Math.min(distance, swappedDistance);

    const roundedMatch =
      roundCoord(currentCoords.lat, ROUND_COMPARE_DECIMALS) === roundCoord(bossStoreInfo.lat, ROUND_COMPARE_DECIMALS) &&
      roundCoord(currentCoords.lon, ROUND_COMPARE_DECIMALS) === roundCoord(bossStoreInfo.lon, ROUND_COMPARE_DECIMALS);

    return wifiMatch || (hasLocationInfo && effectiveDistance <= RELAXED_DISTANCE_M) || roundedMatch;
  }, [currentWifiName, bossStoreInfo, currentCoords, connectionStatus.gps]);

  const addTodo = () => {
    if (todoText.trim() === "") return;
    setTodoList([
      ...todoList,
      { id: Date.now(), text: todoText, isCompleted: false },
    ]);
    setTodoText("");
  };
  const toggleTodo = (id: number) =>
    setTodoList(
      todoList.map((t) =>
        t.id === id ? { ...t, isCompleted: !t.isCompleted } : t,
      ),
    );
  const deleteTodo = (id: number) =>
    setTodoList(todoList.filter((t) => t.id !== id));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        <Header notificationCount={notificationCount} />

        {!currentStoreId ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
              <Ionicons name="storefront-outline" size={80} color="#C4C4C4" />
              <Text style={styles.emptyTitle}>소속된 매장이 없습니다</Text>
              <Text style={styles.emptyDesc}>
                매장에 합류하여 실시간 출퇴근 기록과 근무 일정을 확인해보세요!
              </Text>
              <TouchableOpacity style={styles.registerButton} onPress={() => router.push("/(tabs)/staff/Registration")}>
                <Text style={styles.registerButtonText}>매장 찾으러 가기</Text>
                <Ionicons name="search" size={20} color="#9747FF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>
                반갑습니다, <Text style={styles.greetingName}>{userName}</Text> 님!👋
              </Text>
            </View>
            <View style={styles.inviteRow}>
              <TouchableOpacity
                style={styles.manualButton}
                activeOpacity={0.7}
                onPress={() => {
                  router.push("/(tabs)/staff/Manual");
                }}
              >
                <Text style={styles.manualButtonText}>매뉴얼 보기</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>이번 달 받을 월급은?</Text>
              <Text style={styles.salaryPeriod}>
                {estimatedHasValue
                  ? estimatedSalary?.period || monthlySummary?.period || "-"
                  : monthlySummary?.period || estimatedSalary?.period || "-"}
              </Text>
              <Text style={styles.salaryAmountLarge}>
                {finalDisplayAmount != null
                  ? `${finalDisplayAmount.toLocaleString()}원`
                  : "-"}
              </Text>
              <Text style={styles.salaryMetaText}>
                근무 시간: {formatWorkHours(finalDisplayHours)}
              </Text>

            </View>
            

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>오늘도 화이팅! 💰</Text>
              <Text style={styles.statusText}>
                현재 상태 :{" "}
                {!isWorking
                  ? "출근 전"
                  : todayStatus === "LATE"
                    ? "지각(근무중)"
                    : todayStatus === "ON"
                      ? "정상출근"
                      : "근무 중"}
              </Text>

              <TouchableOpacity
                style={[
                  styles.checkInButton,
                  isInZone ? { backgroundColor: "#E0D5FF99" } : { backgroundColor: "#E0D5FF99" },
                  isWorking && { backgroundColor: "#E0D5FF99" },
                ]}
                onPress={handleAttendance}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.checkInButtonText}>{isWorking ? "퇴근하기" : "출근하기"}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.locationRow}>
                <StatusIndicator
                  icon="wifi"
                  label={
                    normalizeSsidForCompare(currentWifiName) === normalizeSsidForCompare(bossStoreInfo.wifiSsid)
                      ? "매장 WiFi 연결됨"
                      : "WiFi 정보 불일치"
                  }
                  isActive={normalizeSsidForCompare(currentWifiName) === normalizeSsidForCompare(bossStoreInfo.wifiSsid)}
                />
                <View style={{ width: 1, height: 12, backgroundColor: "#E0D5FF" }} />
                <StatusIndicator icon="location" label={currentLocationName} isActive={connectionStatus.gps} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>오늘의 To Do List</Text>
              {todoList.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <Text style={{ color: "#AFAFAF" }}>
                    오늘의 할 일을 입력해 주세요✏️
                  </Text>
                </View>
              ) : (
                todoList.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.todoItem}
                    onPress={() => toggleTodo(item.id)}
                    onLongPress={() => deleteTodo(item.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        item.isCompleted && {
                          backgroundColor: "#9747FF",
                          borderColor: "#9747FF",
                        },
                      ]}
                    >
                      {item.isCompleted && (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.todoText,
                        item.isCompleted && {
                          textDecorationLine: "line-through",
                          color: "#AFAFAF",
                        },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
              <View style={styles.inputContainer}>
                <TextInput
                  value={todoText}
                  onChangeText={setTodoText}
                  placeholder="할 일을 입력해주세요"
                  style={styles.input}
                  onSubmitEditing={addTodo}
                />
                <TouchableOpacity onPress={addTodo}>
                  <Ionicons name="add-circle" size={32} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

        
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>근무 시간표</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {weeklySchedules.map((day, idx) => (
                  <View key={`${day.day}-${idx}`} style={{ marginRight: 12 }}>
                    <ScheduleCard data={day} />
                  </View>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>

      {currentStoreId ? (
        <Footer />
      ) : (
        <View
          style={{
            height: 85,
            backgroundColor: "#F9F9F9",
            borderTopWidth: 1,
            borderTopColor: "#EEE",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#CCC", fontSize: 12 }}>매장 연결 후 메뉴 이용이 가능합니다</Text>
        </View>
      )}
    </SafeAreaView>
  );
}