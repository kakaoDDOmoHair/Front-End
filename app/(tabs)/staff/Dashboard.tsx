import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Network from "expo-network";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
const roundCoord = (value: number, digits: number) => {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
};

const extractAttendanceIdFromResponse = (data: any) => {
  return (
    data?.attendanceId ??
    data?.attendance_id ??
    data?.data?.attendanceId ??
    data?.data?.attendance_id ??
    data?.result?.attendanceId ??
    null
  );
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
  const [salaryEstimate, setSalaryEstimate] = useState<{
    period: string;
    amount: number;
    totalHours: number | null;
    diff: number | null;
  } | null>(null);

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

  const getWeekStartDate = () => {
    const now = new Date();
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day);
    return sunday.toISOString().split("T")[0];
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
      const payload = response.data?.data || response.data;
      const list =
        payload?.list || payload?.attendances || payload?.items || [];
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

  const fetchEstimatedSalary = async (storeId: number, uid: number) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const response = await api.get("/api/v1/salary/estimated", {
        params: { storeId, userId: uid, year, month },
      });
      const payload = response.data?.data || response.data;
      const amount = Number(payload?.amount) || 0;
      const period = payload?.period || "";
      setSalaryEstimate({
        period,
        amount,
        totalHours:
          payload?.totalHours !== undefined ? Number(payload.totalHours) : null,
        diff: null,
      });
    } catch (e) {
      setSalaryEstimate(null);
    }
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
      const list = Array.isArray(payload) ? payload : payload?.data || payload?.list || [];

      if (!Array.isArray(list) || list.length === 0) return;

      // AttendanceDto.AttendanceLog: { attendanceId, startTime, endTime, status, ... }
      // 출근중 후보: status=ON/LATE AND endTime is null
      const candidates = list
        .map((x: any) => ({
          attendanceId: x?.attendanceId ?? x?.attendance_id ?? x?.id ?? null,
          status: x?.status ?? x?.attendanceStatus ?? x?.state ?? null,
          endTime: x?.endTime ?? x?.checkOutTime ?? x?.check_out_time ?? null,
          startTime: x?.startTime ?? x?.checkInTime ?? x?.check_in_time ?? null,
        }))
        .filter((x: any) => x.attendanceId != null);

      const on = candidates.find((x: any) => (x.status === "ON" || x.status === "LATE") && !x.endTime);

      if (on?.attendanceId) {
        const idNum = Number(on.attendanceId);
        if (Number.isFinite(idNum) && idNum > 0) {
          setAttendanceId(idNum);
          setIsWorking(true);
          await AsyncStorage.setItem("attendanceId", String(idNum));
          return;
        }
      }
    } catch (e) {
      // ignore best-effort
    }
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
        fetchEstimatedSalary(resolvedStoreId, resolvedUserId);
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

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsLoading(false);
        attendanceRequestRef.current = false;
        return Alert.alert("권한 필요", "위치 권한을 허용해 주세요.");
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const netState = await Network.getNetworkStateAsync();
      const isWifi = netState.type === Network.NetworkStateType.WIFI;
      const wifiInfo = isWifi ? await safeGetWifiInfo() : { ssid: null, bssid: null };
      const ssid = wifiInfo.ssid;
      const bssid = wifiInfo.bssid;

      if (hasStoreInfo) {
        const distance = hasLocationInfo
          ? getDistance(loc.coords.latitude, loc.coords.longitude, storeInfo.lat, storeInfo.lon)
          : null;

        const swappedDistance = hasLocationInfo
          ? getDistance(loc.coords.latitude, loc.coords.longitude, storeInfo.lon, storeInfo.lat)
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
          hasLocationInfo &&
          effectiveDistance !== null &&
          effectiveDistance <= RELAXED_DISTANCE_M;

        const isRoundedLocationMatched =
          hasLocationInfo &&
          roundCoord(loc.coords.latitude, ROUND_COMPARE_DECIMALS) ===
            roundCoord(storeInfo.lat, ROUND_COMPARE_DECIMALS) &&
          roundCoord(loc.coords.longitude, ROUND_COMPARE_DECIMALS) ===
            roundCoord(storeInfo.lon, ROUND_COMPARE_DECIMALS);

        if (!isWifiMatched && !isLocationMatched && !isRoundedLocationMatched) {
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
        // 출근
        const response = await api.post("/api/v1/attendances/clock-in", {
          storeId: currentStoreId,
          userId,
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
          wifiBssid: bssid || ssid || "",
        });

        const newId = extractAttendanceIdFromResponse(response?.data);
        if (newId) {
          const idNum = Number(newId);
          setAttendanceId(idNum);
          setIsWorking(true);
          await AsyncStorage.setItem("attendanceId", String(idNum));
          Alert.alert("출근 완료", "오늘도 즐거운 근무 되세요!");
        } else {
          Alert.alert("알림", "출근은 처리됐지만 attendanceId를 받지 못했습니다.");
        }
      } else {
        // 퇴근: ✅ attendanceId를 로컬 변수로 확정해서 보냄 (state 지연/null 방지)
        let aid: number | null = attendanceId ?? null;
        if (!aid) {
          const storedAttendanceId = await AsyncStorage.getItem("attendanceId");
          aid = storedAttendanceId ? Number(storedAttendanceId) : null;
        }

        if (!aid) {
          // 서버로 best-effort 동기화 시도
          await syncWorkingFromServerByMonthly(userId);
          const storedAttendanceId = await AsyncStorage.getItem("attendanceId");
          aid = storedAttendanceId ? Number(storedAttendanceId) : null;
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

        await api.post("/api/v1/attendances/clock-out", {
          attendanceId: aid,
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
        });

        setIsWorking(false);
        setAttendanceId(null);
        await AsyncStorage.removeItem("attendanceId");
        Alert.alert("퇴근 완료", "오늘도 고생 많으셨습니다!");
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;
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
        <Header notificationCount={unreadCount} />

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
                반갑습니다, <Text style={styles.greetingName}>{userName}</Text> 님!
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>이번 달 받을 월급은? 💰</Text>
              <Text style={styles.salaryPeriod}>
                {salaryEstimate?.period || "-"}
              </Text>
              <Text style={styles.salaryAmountLarge}>
                {salaryEstimate
                  ? salaryEstimate.amount.toLocaleString()
                  : "-"}
              </Text>
              {salaryEstimate?.diff !== null && salaryEstimate ? (
                <View style={styles.salaryDiffRow}>
                  <Text style={styles.salaryDiffLabel}>전월 대비</Text>
                  <Text
                    style={[
                      styles.salaryDiffText,
                      salaryEstimate.diff >= 0
                        ? styles.salaryDiffUp
                        : styles.salaryDiffDown,
                    ]}
                  >
                    {salaryEstimate.diff >= 0
                      ? `+${salaryEstimate.diff.toLocaleString()}`
                      : salaryEstimate.diff.toLocaleString()}
                  </Text>
                  <Text style={styles.salaryDiffLabel}>
                    {salaryEstimate.diff >= 0 ? "증가했습니다." : "감소했습니다."}
                  </Text>
                </View>
              ) : (
                <View style={styles.salaryDiffRow}>
                  <Text style={styles.salaryDiffLabel}>
                    전월 기록이 없습니다.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>오늘도 화이팅! 💰</Text>
              <Text style={styles.statusText}>현재 상태 : {isWorking ? "근무 중" : "출근 전"}</Text>

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