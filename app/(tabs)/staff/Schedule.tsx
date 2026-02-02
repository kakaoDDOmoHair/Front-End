import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import api from "../../../constants/api";
import type { ModificationTargetType } from "../../../services/modificationApi";
import { registerModification } from "../../../services/modificationApi";

import { Calendar } from "react-native-calendars";
import CustomDatePicker from "../../../components/common/CustomDatePicker";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { useTriggerNotificationRefetch } from "../../../contexts/UnreadNotificationContext";
import { useNotificationCount } from "../../../hooks/useNotificationCount";
import { styles } from "../../../styles/tabs/staff/Schedule";

interface WorkData {
  id: string;
  originalId: number;
  date: string;
  startTime: string;
  endTime: string;
  breakTime: number; 
  registeredTime: string;
  wifiTime: string;
  isPlanned: boolean;
  storeName: string;
  storeId: number;
}

const WorkerSchedule: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userStoreName, setUserStoreName] = useState("");
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [workHistory, setWorkHistory] = useState<WorkData[]>([]);

  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakTime, setBreakTime] = useState<number>(30);

  const [showRequestMenu, setShowRequestMenu] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestType, setRequestType] = useState<"수정" | "삭제">("수정");
  const [targetType, setTargetType] = useState<ModificationTargetType>("SCHEDULE");
  const [requestDate, setRequestDate] = useState(today);
  const [requestShowCalendar, setRequestShowCalendar] = useState(false);
  const [requestStartTime, setRequestStartTime] = useState("");
  const [requestEndTime, setRequestEndTime] = useState("");
  const [requestBreakTime, setRequestBreakTime] = useState(30);
  const [requestReason, setRequestReason] = useState("");
  const router = useRouter();
  const notificationCount = useNotificationCount("staff");
  const triggerNotificationRefetch = useTriggerNotificationRefetch();

  const selectedWorkDetail = workHistory.find((w) => w.date === selectedDate);

  const shiftDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const getAuthHeader = async () => {
    let token = null;
    try {
      if (Platform.OS === "web") token = localStorage.getItem("user_token");
      else {
        token = await SecureStore.getItemAsync("user_token");
        if (!token) token = await AsyncStorage.getItem("user_token");
      }
    } catch (e) {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /** API·캘린더와 비교 시 날짜 형식 통일 (YYYY-MM-DD) */
  const normalizeDate = (d: string | undefined): string => {
    if (!d) return "";
    const str = String(d).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const parsed = new Date(str);
    if (Number.isNaN(parsed.getTime())) return str;
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  /** ISO 또는 "HH:mm" → "HH:mm" (기록 시간 표시용). ISO면 로컬(한국 KST) 시각으로 변환 — UTC가 아닌 한국 시간으로 표시 */
  const toHHmm = (val: string | null | undefined): string => {
    if (val == null || val === "") return "00:00";
    const s = String(val).trim();
    const match = s.match(/^(\d{1,2}):(\d{2})$/);
    if (match) return `${String(parseInt(match[1], 10)).padStart(2, "0")}:${match[2]}`;
    const date = new Date(s);
    if (!Number.isNaN(date.getTime())) {
      const h = date.getHours();
      const m = date.getMinutes();
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return "00:00";
  };

  const fetchMyScheduleData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const storedUsername = await AsyncStorage.getItem("username");

      const profileRes = await api.get(`/api/v1/users/me`, {
        params: storedUsername ? { username: storedUsername } : {},
        headers,
      });

      const userData = profileRes.data.data || profileRes.data;
      if (userData) {
        setUserName(userData.name);
        setUserId(userData.userId || userData.id);
        setCurrentStoreId(userData.storeId);
        if (userData.storeName) setUserStoreName(userData.storeName);
      }

      const scheduleRes = await api.get(`/api/v1/schedules/my-weekly`, {
        params: { username: userData?.username || storedUsername },
        headers,
      });

      const raw = scheduleRes.data?.data ?? scheduleRes.data?.content ?? scheduleRes.data;
      const dataList = Array.isArray(raw) ? raw : raw?.list ?? raw?.schedules ?? [];
      const storedStoreName = await AsyncStorage.getItem("storeName");
      const uid = userData?.userId ?? userData?.id ?? userId;

      let mappedData: WorkData[] = [];

      // 형식 1: 항목에 date/workDate가 있음 (날짜별 스케줄)
      const hasDateField = (arr: any[]) =>
        arr.length > 0 && (arr[0].date != null || arr[0].workDate != null || arr[0].scheduleDate != null);
      if (Array.isArray(dataList) && hasDateField(dataList)) {
        mappedData = dataList.map((item: any, index: number) => {
          const dateRaw = item.date ?? item.workDate ?? item.scheduleDate;
          const dateStr = normalizeDate(dateRaw) || String(dateRaw || "").slice(0, 10);
          const isPast = dateStr < today;
          const sid = item.scheduleId ?? item.id ?? item.schedule_id;
          const timeStr = (item.time && String(item.time).trim()) ? String(item.time).trim() : "";
          const timeParts = timeStr ? timeStr.split("~") : [];
          const startDisplay = timeParts[0]?.trim() || toHHmm(item.startTime) || "00:00";
          const endDisplay = timeParts[1]?.trim() || toHHmm(item.endTime) || "00:00";
          const registeredTime = timeStr || `${startDisplay}~${endDisplay}`;
          return {
            id: sid ? `id-${sid}` : `idx-${index}-${dateStr}`,
            originalId: sid,
            date: dateStr,
            startTime: startDisplay,
            endTime: endDisplay,
            registeredTime,
            wifiTime: item.actualTime || "",
            isPlanned: !isPast,
            storeName: item.storeName || item.storeN || storedStoreName,
            storeId: item.storeId,
            breakTime: Number(item.breakTime || 0),
          };
        });
      }

      // 형식 2: 항목에 day + workers 있음 (요일별 스케줄, 사장님 weekly와 동일)
      const hasDayWorkers = (arr: any[]) =>
        arr.length > 0 && arr[0].day != null && Array.isArray(arr[0].workers);
      if (mappedData.length === 0 && Array.isArray(dataList) && hasDayWorkers(dataList)) {
        const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        dataList.forEach((item: any) => {
          const dayIndex = dayNames.indexOf(String(item.day).toUpperCase());
          if (dayIndex < 0) return;
          const slotDate = new Date(weekStart);
          slotDate.setDate(weekStart.getDate() + dayIndex);
          const dateStr = slotDate.toISOString().split("T")[0];
          const timeStr = (item.time && String(item.time).trim()) ? String(item.time).trim() : "";
          const timeParts = timeStr ? timeStr.split("~") : [];
          const startTime = timeParts[0]?.trim() || toHHmm(item.startTime) || "00:00";
          const endTime = timeParts[1]?.trim() || toHHmm(item.endTime) || "00:00";
          const registeredTimeSlot = timeStr || `${startTime}~${endTime}`;
          const workers = item.workers ?? [];
          workers.forEach((w: any) => {
            if (uid != null && Number(w?.userId) !== Number(uid) && Number(w?.user_id) !== Number(uid)) return;
            const sid = w.scheduleId ?? w.schedule_id ?? w.id;
            if (sid == null) return;
            const isPast = dateStr < today;
            const wTimeStr = (w.time && String(w.time).trim()) ? String(w.time).trim() : timeStr;
            const wTimeParts = wTimeStr ? wTimeStr.split("~") : [];
            const wStart = wTimeParts[0]?.trim() || toHHmm(w.startTime ?? item.startTime) || startTime;
            const wEnd = wTimeParts[1]?.trim() || toHHmm(w.endTime ?? item.endTime) || endTime;
            mappedData.push({
              id: `id-${sid}`,
              originalId: sid,
              date: dateStr,
              startTime: wTimeStr ? wStart : startTime,
              endTime: wTimeStr ? wEnd : endTime,
              registeredTime: wTimeStr || registeredTimeSlot,
              wifiTime: "",
              isPlanned: !isPast,
              storeName: item.storeName || storedStoreName,
              storeId: item.storeId,
              breakTime: Number(item.breakTime ?? w.breakTime ?? 0),
            });
          });
        });
      }

      // 기록된 근무: 출퇴근(attendances/monthly) 병합 — 대시보드에서 출퇴근 찍은 날이 스케줄에 남도록
      if (uid != null && Number.isFinite(uid)) {
        try {
          const now = new Date();
          const months: { year: number; month: number }[] = [
            { year: now.getFullYear(), month: now.getMonth() + 1 },
          ];
          const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          months.push({ year: prev.getFullYear(), month: prev.getMonth() + 1 });
          const dateToWork = new Map<string, WorkData>();
          mappedData.forEach((d) => dateToWork.set(d.date, { ...d }));
          for (const { year, month } of months) {
            const res = await api.get("/api/v1/attendances/monthly", {
              params: { userId: uid, year, month },
              headers,
            });
            const payload = res.data?.data ?? res.data;
            const list = Array.isArray(payload)
              ? payload
              : payload?.list ??
                payload?.data ??
                payload?.items ??
                payload?.attendances ??
                (payload && typeof payload === "object" && "list" in payload ? (payload as any).list : null) ??
                [];
            if (!Array.isArray(list)) continue;
            for (const a of list) {
              const dateRaw =
                a.workDate ?? a.date ?? a.work_date ?? a.attendanceDate ?? a.attendance_date;
              const startRaw = a.startTime ?? a.checkInTime ?? a.start_time ?? a.check_in_time;
              const dateFromStart =
                startRaw && typeof startRaw === "string" && startRaw.length >= 10
                  ? startRaw.slice(0, 10)
                  : "";
              const dateStr = (() => {
                if (dateRaw && typeof dateRaw === "string") {
                  if (dateRaw.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(dateRaw))
                    return dateRaw.slice(0, 10);
                  const parsed = normalizeDate(dateRaw);
                  if (parsed) return parsed;
                }
                if (dateFromStart && /^\d{4}-\d{2}-\d{2}/.test(dateFromStart)) return dateFromStart;
                return "";
              })();
              if (!dateStr) continue;
              if (!startRaw) continue;
              const startTimeActual = toHHmm(startRaw);
              const endTimeActual = toHHmm(
                a.endTime ?? a.checkOutTime ?? a.end_time ?? a.check_out_time,
              );
              const aid = a.attendanceId ?? a.attendance_id ?? a.id ?? 0;
              const apiTime = (a.time && String(a.time).trim()) ? String(a.time).trim() : "";
              const recordedTimeStr = apiTime || (endTimeActual !== "00:00"
                ? `${startTimeActual}~${endTimeActual}`
                : `${startTimeActual}~`);
              const existing = dateToWork.get(dateStr);
              if (existing) {
                dateToWork.set(dateStr, {
                  ...existing,
                  wifiTime: recordedTimeStr,
                  isPlanned: false,
                });
              } else {
                dateToWork.set(dateStr, {
                  id: `att-${aid}-${dateStr}`,
                  originalId: Number(aid) || 0,
                  date: dateStr,
                  startTime: startTimeActual,
                  endTime: endTimeActual,
                  registeredTime: "-",
                  wifiTime: recordedTimeStr,
                  isPlanned: false,
                  storeName: storedStoreName ?? "",
                  storeId: Number(userData?.storeId) || 0,
                  breakTime: Number(a.breakTime ?? 0),
                });
              }
            }
          }
          mappedData = Array.from(dateToWork.values());
        } catch (e) {
          console.warn("[기록된 근무 병합 실패]", e);
        }
      }

      // 삭제 요청 수락 후 00:00~00:00으로 바뀐 항목은 목록·캘린더에서 아예 안 보이게 제외
      const isDeletedSlot = (d: WorkData) =>
        (d.startTime === "00:00" || d.startTime === "0:00") &&
        (d.endTime === "00:00" || d.endTime === "0:00");
      setWorkHistory(
        mappedData
          .filter((d) => !isDeletedSlot(d))
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          ),
      );
      // 근무 기록이 로드됐다 = users/me, my-weekly 는 200을 받은 것. 같은 토큰으로 정정 요청도 감
      console.log("[근무 기록 로드 성공] users/me, my-weekly 200 — 이때 쓴 토큰이 정정 요청에도 그대로 사용됩니다.");
    } catch (error) {
      console.error("데이터 로드 실패", error);
    } finally {
      setLoading(false);
    }
  };

  // 마운트·포커스 시 로드 (대시보드에서 출퇴근 찍은 뒤 돌아오면 기록된 근무 반영)
  useFocusEffect(
    useCallback(() => {
      fetchMyScheduleData();
      // 방금 출퇴근 찍고 탭 전환 시 서버 반영 지연 대비 — 1.5초 후 한 번 더 조회
      const t = setTimeout(() => fetchMyScheduleData(), 1500);
      return () => clearTimeout(t);
    }, []),
  );

  /** "HH:mm"만 있을 때 야간(22:00~00:00 등) 처리: end ≤ start면 다음날 00:00으로 보고 분 반환 */
  const getScheduleWorkMinutes = (startTime: string, endTime: string): number => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (endMinutes <= startMinutes) {
      const toMidnight = 24 * 60 - startMinutes;
      const fromMidnight = endMinutes;
      return toMidnight + fromMidnight;
    }
    return endMinutes - startMinutes;
  };

  const getBadgeInfo = (dateString: string) => {
    const data = workHistory.find((d) => d.date === dateString);
    if (!data) return null;

    const totalMinutes = getScheduleWorkMinutes(data.startTime, data.endTime);
    const actualWorkMinutes = totalMinutes - (data.breakTime ?? 0);

    const finalMinutes = actualWorkMinutes > 0 ? actualWorkMinutes : 0;
    const h = Math.floor(finalMinutes / 60);
    const m = finalMinutes % 60;

    let color = "#6B4EFF";
    let bgColor = "#F0EBFF";
    if (data.isPlanned) {
      color = "#4A90E2";
      bgColor = "#E1F0FF";
    }

    return { label: `${h}h${m > 0 ? ` ${m}m` : ""}`, color, bgColor };
  };

  const formatTime = (text: string, setter: (val: string) => void) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length >= 3)
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    setter(formatted.slice(0, 5));
  };

  const handleSave = async () => {
    if (!startTime || !endTime) {
      Alert.alert("알림", "시간을 입력해주세요.");
      return;
    }
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const storedUsername = await AsyncStorage.getItem("username");

      const payload = {
        userId: userId,
        username: storedUsername,
        workDate: selectedDate,
        startTime: startTime,
        endTime: endTime,
        breakTime: String(breakTime),
        storeId: currentStoreId,
      };

      const res = await api.post(`/api/v1/schedules`, payload, { headers });
      if (res.status === 200 || res.status === 201) {
        Alert.alert("성공", "근무가 등록되었습니다.");
        setShowActionModal(false);
        setStartTime("");
        setEndTime("");
        fetchMyScheduleData();
        triggerNotificationRefetch();
      }
    } catch (error) {
      Alert.alert("실패", "서버 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async () => {
    if (!currentStoreId) {
      Alert.alert("알림", "매장 정보를 불러올 수 없습니다.");
      return;
    }
    if (!requestReason.trim()) {
      Alert.alert("알림", "사유를 입력해주세요.");
      return;
    }
    if (requestType === "수정" && (!requestStartTime || !requestEndTime)) {
      Alert.alert("알림", "근무 시간을 입력해주세요.");
      return;
    }

    const normRequestDate = normalizeDate(requestDate);
    const detail = workHistory.find((w) => normalizeDate(w.date) === normRequestDate);
    const hasSchedule = detail && detail.originalId;
    const hasAttendance = detail && detail.wifiTime && detail.wifiTime.trim() !== "" && detail.wifiTime !== "-";

    // 삭제 요청 시 등록 시간과 기록 시간이 모두 있으면 둘 다 삭제 요청
    if (requestType === "삭제" && hasSchedule && hasAttendance) {
      // 둘 다 삭제 요청을 보냄
      try {
        setLoading(true);
        const headers = await getAuthHeader();
        const authHeaders = headers && "Authorization" in headers ? (headers as Record<string, string>) : undefined;

        // 1. 등록 시간 삭제 요청
        let scheduleId = detail.originalId ?? (detail as any)?.scheduleId;
        if (!scheduleId && currentStoreId) {
          try {
            const d = new Date(normRequestDate);
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay());
            const startDateStr = weekStart.toISOString().split("T")[0];
            const res = await api.get("/api/v1/schedules/weekly", {
              params: { storeId: currentStoreId, startDate: startDateStr },
              headers: authHeaders,
            });
            const list = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.list ?? [];
            const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const dayName = dayNames[d.getDay()];
            const dayItem = list.find((x: any) => String(x?.day).toUpperCase() === dayName);
            if (dayItem?.workers) {
              const myName = (userName || "").trim();
              const me = dayItem.workers.find(
                (w: any) => (String(w?.name ?? "").trim() === myName)
              );
              scheduleId = me?.scheduleId ?? me?.schedule_id ?? me?.id;
            }
          } catch (_) {}
        }

        // 2. 기록 시간 삭제 요청
        let attendanceId: number | null = null;
        try {
          const [y, m] = normRequestDate.split("-").map(Number);
          const res = await api.get("/api/v1/attendances/monthly", {
            params: { userId: userId, year: y, month: m },
            headers: authHeaders,
          });
          const payload = res.data?.data ?? res.data;
          const list = Array.isArray(payload) ? payload : payload?.list ?? payload?.data ?? [];
          const onDate = (item: any) => {
            const d = item.date ?? item.workDate ?? item.attendanceDate ?? item.startTime;
            if (!d) return false;
            const str = typeof d === "string" ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
            return normalizeDate(str) === normRequestDate;
          };
          const me = Array.isArray(list) ? list.find(onDate) : null;
          attendanceId = me?.attendanceId ?? me?.attendance_id ?? me?.id ?? null;
        } catch (e) {
          console.error(e);
        }

        // 둘 다 삭제 요청 전송
        const afterValue = "00:00~00:00";
        const requests = [];
        
        if (scheduleId && scheduleId > 0) {
          requests.push(
            registerModification(
              {
                storeId: currentStoreId,
                targetType: "SCHEDULE",
                targetId: scheduleId,
                requestType: "DELETE",
                afterValue,
                targetDate: requestDate,
                reason: requestReason.trim(),
              },
              authHeaders
            )
          );
        }

        if (attendanceId && attendanceId > 0) {
          requests.push(
            registerModification(
              {
                storeId: currentStoreId,
                targetType: "ATTENDANCE",
                targetId: attendanceId,
                requestType: "DELETE",
                afterValue,
                targetDate: requestDate,
                reason: requestReason.trim(),
              },
              authHeaders
            )
          );
        }

        if (requests.length === 0) {
          Alert.alert("알림", "삭제할 항목을 찾을 수 없습니다.");
          return;
        }

        await Promise.all(requests);
        Alert.alert("완료", "등록 시간과 기록 시간 삭제 요청이 전달되었습니다. 사장님 알림에 표시됩니다.");
        setRequestModalVisible(false);
        setRequestReason("");
        setRequestStartTime("");
        setRequestEndTime("");
        return;
      } catch (e: any) {
        const status = e?.response?.status;
        const data = e?.response?.data;
        if (status === 401) {
          Alert.alert("로그인 필요", data?.message ?? "로그인이 필요합니다.", [
            { text: "확인", style: "cancel" },
            { text: "로그인하기", onPress: () => router.replace("/(auth)/Login") },
          ]);
        } else {
          const msg = data?.message ?? data?.error ?? e?.message ?? "요청 전송에 실패했습니다.";
          Alert.alert("실패", String(msg));
        }
        return;
      } finally {
        setLoading(false);
      }
    }

    // 기존 로직 (수정 요청 또는 하나만 있는 경우)
    let targetId: number;
    if (targetType === "SCHEDULE") {
      let detail = workHistory.find((w) => normalizeDate(w.date) === normRequestDate);
      let sid = detail?.originalId ?? (detail as any)?.scheduleId;

      // my-weekly에는 scheduleId가 없음 → 해당 주 weekly API로 scheduleId 조회 (workers에는 scheduleId, name, breakTime만 있음 → 이름으로 매칭)
      if ((!detail || sid == null || sid === undefined) && currentStoreId) {
        try {
          const d = new Date(normRequestDate);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          const startDateStr = weekStart.toISOString().split("T")[0];
          const headers = await getAuthHeader();
          const res = await api.get("/api/v1/schedules/weekly", {
            params: { storeId: currentStoreId, startDate: startDateStr },
            headers,
          });
          const list = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.list ?? [];
          const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          const dayName = dayNames[d.getDay()];
          const myName = (userName || "").trim();
          // ✅ 같은 요일의 모든 슬롯에서 내 이름을 가진 worker를 찾기
          const sameDayItems = list.filter(
            (x: any) => String(x?.day).toUpperCase() === dayName,
          );
          for (const item of sameDayItems) {
            const workers = item?.workers ?? [];
            const me = workers.find(
              (w: any) => String(w?.name ?? "").trim() === myName,
            );
            if (me) {
              sid = me.scheduleId ?? me.schedule_id ?? me.id;
              break; // 첫 매칭만 사용
            }
          }
        } catch (_) {}
      }

      if (sid == null || sid === undefined || (typeof sid === "number" && sid <= 0)) {
        Alert.alert("알림", "해당 날짜의 등록된 근무가 없습니다. 스케줄에 등록된 날짜를 선택해 주세요.");
        return;
      }
      targetId = Number(sid);
    } else {
      // daily API에는 attendanceId/userId 없음 → monthly API로 해당 월 출퇴근 목록 조회 후 requestDate와 일치하는 레코드의 id 사용
      try {
        const headers = await getAuthHeader();
        const [y, m] = normRequestDate.split("-").map(Number);
        const res = await api.get("/api/v1/attendances/monthly", {
          params: { userId: userId, year: y, month: m },
          headers,
        });
        const payload = res.data?.data ?? res.data;
        const list = Array.isArray(payload) ? payload : payload?.list ?? payload?.data ?? [];
        const onDate = (item: any) => {
          const d = item.date ?? item.workDate ?? item.attendanceDate ?? item.startTime;
          if (!d) return false;
          const str = typeof d === "string" ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
          return normalizeDate(str) === normRequestDate;
        };
        const me = Array.isArray(list) ? list.find(onDate) : null;
        const aid = me?.attendanceId ?? me?.attendance_id ?? me?.id;
        if (aid == null || aid === "") {
          Alert.alert("알림", "해당 날짜의 기록된 근무가 없습니다. 출퇴근 기록이 있는 날짜를 선택해 주세요.");
          return;
        }
        targetId = Number(aid);
      } catch (e) {
        console.error(e);
        Alert.alert("알림", "기록된 근무를 불러오지 못했습니다. 나중에 다시 시도해 주세요.");
        return;
      }
    }

    // API 스펙: afterValue는 반드시 "HH:mm~HH:mm" 형식
    const padTime = (t: string) => {
      const [h, m] = String(t || "00:00").split(":");
      return `${String(h ?? "0").padStart(2, "0")}:${String(m ?? "0").padStart(2, "0")}`;
    };
    const afterValue =
      requestType === "삭제"
        ? "00:00~00:00"
        : `${padTime(requestStartTime)}~${padTime(requestEndTime)}`;
    const apiRequestType = requestType === "삭제" ? "DELETE" : "UPDATE";
    let authHeaders: { Authorization?: string } | undefined;
    try {
      setLoading(true);
      authHeaders = await getAuthHeader();
      const headers = authHeaders && "Authorization" in authHeaders ? (authHeaders as Record<string, string>) : undefined;
      // 근무 기록(users/me, my-weekly)과 같은 토큰 소스 사용 — 401이면 백엔드가 modifications만 JWT 검사하는지 확인
      const tokenForLog = headers?.Authorization?.replace(/^Bearer\s+/i, "").trim() ?? "";
      console.log("[정정 요청] 사용하는 토큰 (근무 기록과 동일 소스)", {
        토큰_있음: !!tokenForLog,
        토큰_글자수: tokenForLog.length,
        토큰_앞3자: tokenForLog.length >= 3 ? tokenForLog.slice(0, 3) + "..." : "(없음)",
      });
      await registerModification(
        {
          storeId: currentStoreId,
          targetType,
          targetId,
          requestType: apiRequestType,
          afterValue,
          targetDate: requestDate,
          reason: requestReason.trim(),
        },
        headers
      );
      Alert.alert("완료", "정정 요청이 전달되었습니다. 사장님 알림에 표시됩니다.");
      setRequestModalVisible(false);
      setRequestReason("");
      setRequestStartTime("");
      setRequestEndTime("");
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      if (status === 401) {
        console.warn(
          "[401] 정정 요청만 실패 — 근무 기록(users/me, my-weekly)은 같은 토큰으로 200을 받은 상태입니다. " +
            "백엔드가 /modifications 에서만 JWT를 검사하거나, 만료/형식 차이로 401을 줄 수 있습니다. response.data:",
          data
        );
        // 토큰은 보냈는데 401 → 백엔드 DB 조회(findByEmail vs findByUsername) 등으로 인증 정보 미채움. "로그인 필요"보다 구체적으로 안내
        const tokenWasSent = !!(authHeaders && "Authorization" in authHeaders);
        const title = tokenWasSent ? "서버 인증 실패" : "로그인 필요";
        const body = tokenWasSent
          ? "토큰은 전달됐지만 서버에서 인증 정보를 채우지 못했습니다. 같은 토큰으로 근무 기록은 불러와지므로, 백엔드(DB 조회: findByUsername) 수정 후 다시 시도해 주세요."
          : (data?.message ?? "로그인이 필요합니다.");
        Alert.alert(title, body, [
          { text: "확인", style: "cancel" },
          ...(tokenWasSent ? [] : [{ text: "로그인하기", onPress: () => router.replace("/(auth)/Login") }]),
        ]);
      } else {
        const msg = data?.message ?? data?.error ?? e?.message ?? "요청 전송에 실패했습니다.";
        Alert.alert("실패", String(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 고정 */}
      <Header notificationCount={notificationCount} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 근무 시간 섹션 - 이제 스크롤 가능함 */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>근무 시간</Text>
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconTouchArea}
              onPress={() => setShowActionModal(true)}
            >
              <Ionicons name="add-circle" size={32} color="#D1C4E9" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconTouchArea}
              onPress={() => setShowRequestMenu(!showRequestMenu)}
            >
              <MaterialCommunityIcons name="hands-pray" size={28} color="#D1C4E9" />
            </TouchableOpacity>
            {showRequestMenu && (
              <>
                <TouchableOpacity
                  style={styles.requestMenuBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowRequestMenu(false)}
                />
                <View style={[styles.requestMenuBox, { zIndex: 999 }]}>
                  <TouchableOpacity
                    style={[styles.requestMenuItem, styles.requestMenuItemLeft]}
                    onPress={() => {
                      setShowRequestMenu(false);
                      setRequestType("수정");
                      setRequestDate(selectedDate);
                      const detail = workHistory.find((w) => w.date === selectedDate);
                      if (detail) {
                        setRequestStartTime(detail.startTime);
                        setRequestEndTime(detail.endTime);
                        setRequestBreakTime(detail.breakTime);
                      } else {
                        setRequestStartTime("");
                        setRequestEndTime("");
                        setRequestBreakTime(30);
                      }
                      setRequestModalVisible(true);
                    }}
                  >
                    <Text style={[styles.requestMenuText, styles.requestMenuTextPurple]}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestMenuItem, styles.requestMenuItemRight]}
                    onPress={() => {
                      setShowRequestMenu(false);
                      setRequestType("삭제");
                      setRequestDate(selectedDate);
                      const detail = workHistory.find((w) => w.date === selectedDate);
                      if (detail) {
                        setRequestStartTime(detail.startTime);
                        setRequestEndTime(detail.endTime);
                        setRequestBreakTime(detail.breakTime);
                      } else {
                        setRequestStartTime("");
                        setRequestEndTime("");
                        setRequestBreakTime(30);
                      }
                      setRequestModalVisible(true);
                    }}
                  >
                    <Text style={styles.requestMenuText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* 히스토리 카드 */}
        <View style={styles.historyCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.columnLabel}>날짜</Text>
            <Text style={styles.columnLabel}>등록 시간</Text>
            <Text style={styles.columnLabel}>기록 시간</Text>
          </View>
          {workHistory.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.dateCell}>{item.date.split("-")[1]}월 {item.date.split("-")[2]}일</Text>
              <Text style={styles.timeCell}>{item.registeredTime}</Text>
              <Text style={[styles.timeCell, { color: getBadgeInfo(item.date)?.color }]}>
                {item.wifiTime || "-"}
              </Text>
            </View>
          ))}
        </View>

        {/* 캘린더 영역 */}
        <View style={styles.calendarWrapper}>
          <Calendar
            current={selectedDate}
            theme={{ calendarBackground: "#F2F2F2", todayTextColor: "#6B4EFF", arrowColor: "#6B4EFF" }}
            dayComponent={({ date }: any) => {
              const badge = getBadgeInfo(date.dateString);
              const isToday = date.dateString === today;
              const isSelected = date.dateString === selectedDate;
              return (
                <TouchableOpacity
                  onPress={() => { setSelectedDate(date.dateString); setShowDetailModal(true); }}
                  style={[styles.dayBox, isSelected && styles.selectedDay]}
                >
                  <View style={[styles.dayNumberWrap, isToday && styles.todayCircle]}>
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{date.day}</Text>
                  </View>
                  {badge && (
                    <View style={[styles.badge, { backgroundColor: isSelected ? "rgba(107,78,255,0.2)" : badge.bgColor }]}>
                      <Text style={[styles.badgeText, { color: isSelected ? "#333" : badge.color, fontSize: 8 }]}>{badge.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </ScrollView>

      {/* 1. 상세 정보 모달 */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => shiftDate(-1)}><Ionicons name="chevron-back" size={24} color="#333" /></TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedDate.split("-")[1]}월 {selectedDate.split("-")[2]}일 근무</Text>
              <TouchableOpacity onPress={() => shiftDate(1)}><Ionicons name="chevron-forward" size={24} color="#333" /></TouchableOpacity>
            </View>
            <View style={styles.detailInfoBox}>
              <Text style={styles.storeName}>{selectedWorkDetail?.storeName || userStoreName}</Text>
              {selectedWorkDetail ? (
                <>
                  <Text style={styles.detailTimeText}>등록: {selectedWorkDetail.registeredTime === "-" ? "-" : `${selectedWorkDetail.startTime} ~ ${selectedWorkDetail.endTime}`}</Text>
                  {selectedWorkDetail.wifiTime ? (
                    <Text style={styles.detailTimeText}>기록: {selectedWorkDetail.wifiTime}</Text>
                  ) : null}
                  <Text style={styles.detailSubText}>(휴게시간: {selectedWorkDetail.breakTime}분)</Text>
                </>
              ) : <Text style={styles.noWorkText}>근무 기록이 없습니다.</Text>}
            </View>
            <View style={styles.modalBtnGroup}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDetailModal(false)}><Text>뒤로 가기</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={() => { setShowDetailModal(false); setShowActionModal(true); }}>
                <Text style={{ color: "#fff" }}>근무 추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. 근무 등록 모달 */}
      <Modal visible={showActionModal} transparent animationType="fade" onRequestClose={() => setShowActionModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>근무 등록</Text>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>날짜</Text>
              <TouchableOpacity style={styles.dateInputBox} onPress={() => setShowCalendar(true)}>
                <Text>{selectedDate}</Text>
                <Ionicons name="calendar-outline" size={20} color="#AAA" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>근무 시간</Text>
              <View style={styles.timeInputRow}>
                <TextInput
                  style={styles.timeInput}
                  value={startTime}
                  onChangeText={(t) => formatTime(t, setStartTime)}
                  onFocus={() => { if (startTime === "00:00") setStartTime(""); }}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholder="00:00"
                  placeholderTextColor="#BBB"
                  returnKeyType="done"
                />
                <Text> ~ </Text>
                <TextInput
                  style={styles.timeInput}
                  value={endTime}
                  onChangeText={(t) => formatTime(t, setEndTime)}
                  onFocus={() => { if (endTime === "00:00") setEndTime(""); }}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholder="00:00"
                  placeholderTextColor="#BBB"
                  returnKeyType="done"
                />
              </View>
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>휴게 시간 (분)</Text>
              <View style={styles.breakTimeGroup}>
                {[0, 30, 60].map((t) => (
                  <TouchableOpacity key={t} style={[styles.breakTimeBtn, breakTime === t && styles.breakTimeBtnActive]} onPress={() => setBreakTime(t)}>
                    <Text style={[styles.breakTimeText, breakTime === t && styles.breakTimeTextActive]}>{t}분</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalBtnGroup}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowActionModal(false)}><Text>취소</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSave}><Text style={{ color: "#fff" }}>저장</Text></TouchableOpacity>
            </View>
            {/* 달력 모달 (이 모달 안에서 최하단에 배치) */}
            <CustomDatePicker visible={showCalendar} value={selectedDate} onDateChange={(d) => { setSelectedDate(d); setShowCalendar(false); }} onClose={() => setShowCalendar(false)} />
          </View>
        </View>
      </Modal>

      {/* 3. 수정/삭제 요청하기 모달 (기존 구조 완벽 복구) */}
      <Modal visible={requestModalVisible} transparent animationType="fade" onRequestClose={() => setRequestModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{requestType === "수정" ? "수정 요청하기" : "삭제 요청하기"}</Text>
            {/* 대상 선택 (기존 코드) */}
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>대상</Text>
              {requestType === "삭제" && (() => {
                const detail = workHistory.find((w) => normalizeDate(w.date) === normalizeDate(requestDate));
                const hasSchedule = !!(detail && detail.originalId);
                const hasAttendance = !!(detail && detail.wifiTime && detail.wifiTime.trim() !== "" && detail.wifiTime !== "-");
                const bothExist = hasSchedule && hasAttendance;
                return (
                  <>
                    {bothExist && (
                      <Text style={{ color: "#6B4EFF", fontSize: 12, marginBottom: 8, textAlign: "center" }}>
                        등록 시간과 기록 시간이 모두 있어 둘 다 삭제 요청됩니다.
                      </Text>
                    )}
                    <View style={styles.segmentRow}>
                      <TouchableOpacity 
                        style={[styles.segmentBtn, targetType === "SCHEDULE" && styles.segmentBtnActive, bothExist ? { opacity: 0.5 } : undefined]} 
                        onPress={() => !bothExist && setTargetType("SCHEDULE")}
                        disabled={bothExist}
                      >
                        <Text style={[styles.segmentText, targetType === "SCHEDULE" && styles.segmentTextActive]}>등록된 시간</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.segmentBtn, targetType === "ATTENDANCE" && styles.segmentBtnActive, bothExist ? { opacity: 0.5 } : undefined]} 
                        onPress={() => !bothExist && setTargetType("ATTENDANCE")}
                        disabled={bothExist}
                      >
                        <Text style={[styles.segmentText, targetType === "ATTENDANCE" && styles.segmentTextActive]}>기록된 시간</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
              {requestType === "수정" && (
                <View style={styles.segmentRow}>
                  <TouchableOpacity style={[styles.segmentBtn, targetType === "SCHEDULE" && styles.segmentBtnActive]} onPress={() => setTargetType("SCHEDULE")}>
                    <Text style={[styles.segmentText, targetType === "SCHEDULE" && styles.segmentTextActive]}>등록된 시간</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.segmentBtn, targetType === "ATTENDANCE" && styles.segmentBtnActive]} onPress={() => setTargetType("ATTENDANCE")}>
                    <Text style={[styles.segmentText, targetType === "ATTENDANCE" && styles.segmentTextActive]}>기록된 시간</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {/* 날짜 선택 (기존 코드) */}
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>날짜</Text>
              <TouchableOpacity style={styles.dateInputBox} onPress={() => setRequestShowCalendar(true)}>
                <Text>{requestDate}</Text>
                <Ionicons name="calendar-outline" size={20} color="#AAA" />
              </TouchableOpacity>
            </View>
            {/* 근무 시간 (기존 코드) */}
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>근무 시간</Text>
              <View style={styles.timeInputRow}>
                <TextInput
                  style={styles.timeInput}
                  value={requestStartTime}
                  onChangeText={(t) => formatTime(t, setRequestStartTime)}
                  onFocus={() => { if (requestStartTime === "00:00") setRequestStartTime(""); }}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholder="00:00"
                  placeholderTextColor="#BBB"
                  returnKeyType="done"
                />
                <Text> ~ </Text>
                <TextInput
                  style={styles.timeInput}
                  value={requestEndTime}
                  onChangeText={(t) => formatTime(t, setRequestEndTime)}
                  onFocus={() => { if (requestEndTime === "00:00") setRequestEndTime(""); }}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholder="00:00"
                  placeholderTextColor="#BBB"
                  returnKeyType="done"
                />
              </View>
            </View>
            {/* 휴게 시간 (기존 코드) */}
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>휴게 시간 (분)</Text>
              <View style={styles.breakTimeGroup}>
                {[0, 30, 60].map((t) => (
                  <TouchableOpacity key={t} style={[styles.breakTimeBtn, requestBreakTime === t && styles.breakTimeBtnActive]} onPress={() => setRequestBreakTime(t)}>
                    <Text style={[styles.breakTimeText, requestBreakTime === t && styles.breakTimeTextActive]}>{t}분</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* 사유 입력 (기존 코드) */}
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>사유</Text>
              <TextInput style={styles.reasonInput} value={requestReason} onChangeText={setRequestReason} placeholder="사유를 입력해주세요" multiline numberOfLines={3} returnKeyType="done" blurOnSubmit />
            </View>
            <View style={styles.modalBtnGroup}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setRequestModalVisible(false)}><Text>취소</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleRequestSubmit}><Text style={{ color: "#fff" }}>요청하기</Text></TouchableOpacity>
            </View>
            {/* 요청용 달력 모달 */}
            <CustomDatePicker visible={requestShowCalendar} value={requestDate} onDateChange={(d) => { setRequestDate(d); setRequestShowCalendar(false); }} onClose={() => setRequestShowCalendar(false)} />
          </View>
        </View>
      </Modal>

      <Footer />
    </SafeAreaView>
  );
};

export default WorkerSchedule;