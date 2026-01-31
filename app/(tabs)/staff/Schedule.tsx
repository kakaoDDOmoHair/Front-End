import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
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
          return {
            id: sid ? `id-${sid}` : `idx-${index}-${dateStr}`,
            originalId: sid,
            date: dateStr,
            startTime: item.startTime || "00:00",
            endTime: item.endTime || "00:00",
            registeredTime: `${item.startTime || "00:00"}~${item.endTime || "00:00"}`,
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
          const timeParts = (item.time || "").split("~");
          const startTime = item.startTime || timeParts[0]?.trim() || "00:00";
          const endTime = item.endTime || timeParts[1]?.trim() || "00:00";
          const workers = item.workers ?? [];
          workers.forEach((w: any) => {
            if (uid != null && Number(w?.userId) !== Number(uid) && Number(w?.user_id) !== Number(uid)) return;
            const sid = w.scheduleId ?? w.schedule_id ?? w.id;
            if (sid == null) return;
            const isPast = dateStr < today;
            mappedData.push({
              id: `id-${sid}`,
              originalId: sid,
              date: dateStr,
              startTime,
              endTime,
              registeredTime: `${startTime}~${endTime}`,
              wifiTime: "",
              isPlanned: !isPast,
              storeName: item.storeName || storedStoreName,
              storeId: item.storeId,
              breakTime: Number(item.breakTime ?? w.breakTime ?? 0),
            });
          });
        });
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

  useEffect(() => {
    fetchMyScheduleData();
  }, []);

  const getBadgeInfo = (dateString: string) => {
    const data = workHistory.find((d) => d.date === dateString);
    if (!data) return null;

    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);

    const totalMinutes = endH * 60 + endM - (startH * 60 + startM);
    const actualWorkMinutes = totalMinutes - data.breakTime;

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

    let targetId: number;
    const normRequestDate = normalizeDate(requestDate);
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
          const dayItem = list.find((x: any) => String(x?.day).toUpperCase() === dayName);
          if (dayItem?.workers) {
            const myName = (userName || "").trim();
            const me = dayItem.workers.find(
              (w: any) => (String(w?.name ?? "").trim() === myName)
            );
            sid = me?.scheduleId ?? me?.schedule_id ?? me?.id;
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
                {item.isPlanned ? "-" : item.wifiTime || "-"}
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
                  <Text style={styles.detailTimeText}>{selectedWorkDetail.startTime} ~ {selectedWorkDetail.endTime}</Text>
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
              <View style={styles.segmentRow}>
                <TouchableOpacity style={[styles.segmentBtn, targetType === "SCHEDULE" && styles.segmentBtnActive]} onPress={() => setTargetType("SCHEDULE")}>
                  <Text style={[styles.segmentText, targetType === "SCHEDULE" && styles.segmentTextActive]}>등록된 시간</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.segmentBtn, targetType === "ATTENDANCE" && styles.segmentBtnActive]} onPress={() => setTargetType("ATTENDANCE")}>
                  <Text style={[styles.segmentText, targetType === "ATTENDANCE" && styles.segmentTextActive]}>기록된 시간</Text>
                </TouchableOpacity>
              </View>
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