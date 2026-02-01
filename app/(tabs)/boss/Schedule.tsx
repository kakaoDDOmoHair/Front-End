import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomDatePicker from "../../../components/common/CustomDatePicker";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import api from "../../../constants/api";
import { useNotificationCount } from "../../../hooks/useNotificationCount";
import { styles } from "../../../styles/tabs/boss/Schedule";

interface Worker {
  name: string;
  userId: number;
  scheduleId: number;
}

interface ScheduleItem {
  day: string;
  time: string;
  startTime?: string;
  endTime?: string;
  workers: Worker[];
}

interface RealTimeStatus {
  userId: number;
  name: string;
  status: "ON" | "OFF" | "LATE" | "ABSENT";
}

const AttendancePage: React.FC = () => {
  // --- 1. 상태 관리 ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const [weeklySchedules, setWeeklySchedules] = useState<ScheduleItem[]>([]);
  /** 상단 "출퇴근 기록 확인"용 — 항상 오늘이 포함된 주의 스케줄만 유지 */
  const [todayWeekSchedules, setTodayWeekSchedules] = useState<ScheduleItem[]>([]);
  const [realTimeAttendances, setRealTimeAttendances] = useState<
    RealTimeStatus[]
  >([]);
  /** 과거 날짜 선택 시 해당 날짜 출퇴근 (attendances/daily) — 그날 상태 색 유지용 */
  const [selectedDateAttendances, setSelectedDateAttendances] = useState<
    RealTimeStatus[]
  >([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    name: string;
    userId?: number;
  } | null>(null);

  const [editForm, setEditForm] = useState({
    scheduleId: 0,
    date: "",
    start: "12:00",
    end: "18:00",
    breakTime: "30",
    isPlanned: false,
  });
  const notificationCount = useNotificationCount("boss");

  // --- 2. 유틸리티 로직 ---
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - current.getDay());
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
      (label, index) => {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + index);
        return {
          label,
          dateString: date.toISOString().split("T")[0],
          dayNum: date.getDate(),
        };
      },
    );
  }, [selectedDate]);

  const formatTime = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length >= 3)
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    return formatted.slice(0, 5);
  };

  const getAuthHeader = async () => {
    try {
      const token =
        Platform.OS === "web"
          ? localStorage.getItem("user_token")
          : await AsyncStorage.getItem("user_token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
      return {};
    }
  };

  /** 리스트 + 이름/userId로 상태 색 반환. 퇴근(OFF)도 출근 시 색 유지(녹/노랑) */
  const getStatusColorFromList = (
    list: RealTimeStatus[],
    userName: string,
    userId?: number,
  ) => {
    if (!Array.isArray(list)) return "#BDBDBD";
    const user = list.find(
      (u) =>
        u.name.trim() === userName.trim() ||
        (userId != null && userId !== 0 && u.userId === userId),
    );
    switch (user?.status) {
      case "ON":
        return "#00E676"; // 녹색
      case "LATE":
        return "#FFEB3B"; // 노랑 — 퇴근 후에도 노랑 유지
      case "ABSENT":
        return "#FF1744"; // 결근 (빨강)
      case "OFF":
        return "#00E676"; // 퇴근 완료 → 출근 시 색 유지(녹색)
      default:
        return "#BDBDBD";
    }
  };

  // ✅ [상태 색상] 당일 attendances/today 기준 — 퇴근(OFF) 후에도 출근 시 색 유지
  const getStatusColor = (userName: string, userId?: number) =>
    getStatusColorFromList(realTimeAttendances, userName, userId);

  /** 선택한 날짜 기준: 미래→회색, 당일→realTime, 과거→selectedDateAttendances. 당일/과거 모두 퇴근 후에도 출근 시 색 유지 */
  const getStatusColorForWorkDate = (workDate: string, userName: string, userId?: number) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (workDate > todayStr) return "#BDBDBD"; // 미래 → 회색
    if (workDate === todayStr) {
      if (!Array.isArray(realTimeAttendances)) return "#FF1744";
      const user = realTimeAttendances.find(
        (u) =>
          u.name.trim() === userName.trim() ||
          (userId != null && userId !== 0 && u.userId === userId),
      );
      if (!user) return "#FF1744"; // 당일 근무인데 출퇴근 없음 → 결근(빨강)
      return getStatusColorFromList(realTimeAttendances, userName, userId);
    }
    // 과거: 해당 날짜 출퇴근 데이터로 그날 상태 유지. 기록 없으면 출근 안 하는 날(근무날아님) → 회색
    if (workDate !== selectedDate) return "#BDBDBD";
    if (!Array.isArray(selectedDateAttendances)) return "#BDBDBD"; // 과거 데이터 없음 → 근무날아님(회색)
    const user = selectedDateAttendances.find(
      (u) =>
        u.name.trim() === userName.trim() ||
        (userId != null && userId !== 0 && u.userId === userId),
    );
    if (!user) return "#BDBDBD"; // 그날 출퇴근 기록 없음 → 출근 안 하는 날(근무날아님, 회색)
    return getStatusColorFromList(selectedDateAttendances, userName, userId);
  };

  // ✅ [상태 문구] 백엔드에서 받은 상태를 그대로 표시 (근무중, 지각(근무중), 결근, 근무날아님)
  const getStatusLabel = (userName: string, userId?: number): string => {
    if (!Array.isArray(realTimeAttendances)) return "근무날아님";
    const user = realTimeAttendances.find(
      (u) =>
        u.name.trim() === userName.trim() ||
        (userId != null && userId !== 0 && u.userId === userId),
    );
    switch (user?.status) {
      case "ON":
        return "근무중";
      case "LATE":
        return "지각(근무중)";
      case "ABSENT":
        return "결근";
      case "OFF":
      default:
        return "근무날아님";
    }
  };

  // --- 3. 데이터 로드 ---
  /** 선택한 날짜가 포함된 주의 스케줄 (하단 "근무 수정"용) */
  const fetchWeeklySchedule = useCallback(async (id: number, date: string) => {
    try {
      const headers = await getAuthHeader();
      const response = await api.get("/api/v1/schedules/weekly", {
        params: { storeId: id, startDate: date },
        headers,
      });
      setWeeklySchedules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setWeeklySchedules([]);
    }
  }, []);

  /** 오늘이 포함된 주의 일요일 YYYY-MM-DD */
  const getWeekStartDate = useCallback((d: Date) => {
    const sun = new Date(d);
    sun.setDate(d.getDate() - d.getDay());
    return sun.toISOString().split("T")[0];
  }, []);

  /** 상단 "출퇴근 기록 확인"용 — 오늘이 포함된 주만 조회 (날짜 바꿔도 유지) */
  const fetchTodayWeekSchedule = useCallback(async (id: number) => {
    try {
      const headers = await getAuthHeader();
      const startDate = getWeekStartDate(new Date());
      const response = await api.get("/api/v1/schedules/weekly", {
        params: { storeId: id, startDate },
        headers,
      });
      setTodayWeekSchedules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setTodayWeekSchedules([]);
    }
  }, [getWeekStartDate]);

  // API 응답을 RealTimeStatus[] 로 통일 (필드명·대소문자 차이 흡수)
  const mapTodayAttendancesToStatus = useCallback((raw: unknown): RealTimeStatus[] => {
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.list)
        ? (raw as any).list
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : [];
    return list.map((item: any) => {
      const name =
        String(item.name ?? item.userName ?? item.workerName ?? "").trim() || "-";
      const uid = Number(item.userId ?? item.id ?? 0);
      let status = String(
        item.status ?? item.attendanceStatus ?? item.attendance_status ?? item.state ?? "",
      ).toUpperCase();
      if (status !== "ON" && status !== "OFF" && status !== "LATE" && status !== "ABSENT") {
        if (["PRESENT", "IN", "WORKING"].includes(status)) status = "ON";
        else if (["LATE"].includes(status)) status = "LATE";
        else if (["ABSENT", "MISSING"].includes(status)) status = "ABSENT";
        else status = "OFF";
      }
      return { userId: uid, name, status: status as RealTimeStatus["status"] };
    });
  }, []);

  const fetchTodayStatus = useCallback(
    async (id: number) => {
      try {
        const headers = await getAuthHeader();
        const response = await api.get("/api/v1/attendances/today", {
          params: { storeId: id },
          headers,
        });
        const data = response.data;
        const rawList =
          data?.data?.list ??
          data?.data ??
          data?.list ??
          data?.attendances ??
          data?.workers ??
          (Array.isArray(data) ? data : []);
        const list = Array.isArray(rawList)
          ? rawList
          : rawList?.list ?? rawList?.attendances ?? rawList?.items ?? rawList?.data ?? [];
        const normalized = Array.isArray(list) ? list : [];
        const mapped = mapTodayAttendancesToStatus(normalized);

        // 백엔드 응답 확인용 콘솔 (개발 시에만)
        if (__DEV__) {
          console.log("[attendances/today] 응답 전체 response.data:", JSON.stringify(data, null, 2));
          console.log("[attendances/today] 추출한 list 개수:", normalized.length);
          if (normalized.length > 0) {
            normalized.forEach((item: any, i: number) => {
              console.log(
                `[attendances/today] raw[${i}] name=${item.name ?? item.userName ?? item.workerName}, userId=${item.userId ?? item.id}, status(원본)=${item.status ?? item.attendanceStatus ?? "(없음)"}`,
              );
            });
            console.log("[attendances/today] 매핑 결과 mapped:", JSON.stringify(mapped, null, 2));
          } else {
            console.log("[attendances/today] rawList 비어 있음 → 매핑 결과도 빈 배열");
          }
        }

        setRealTimeAttendances(mapped);
      } catch (error) {
        if (__DEV__) console.warn("[attendances/today] 조회 실패", error);
        setRealTimeAttendances([]);
      }
    },
    [mapTodayAttendancesToStatus],
  );

  /** 과거 날짜 선택 시 해당 날짜 출퇴근 조회 — 그날 상태(녹/노랑/빨강) 유지용 */
  const fetchSelectedDateAttendances = useCallback(
    async (id: number, date: string) => {
      const todayStr = new Date().toISOString().split("T")[0];
      if (date >= todayStr) {
        setSelectedDateAttendances([]);
        return;
      }
      try {
        const headers = await getAuthHeader();
        const response = await api.get("/api/v1/attendances/daily", {
          params: { storeId: id, date },
          headers,
        });
        const data = response.data;
        const rawList =
          data?.data?.list ??
          data?.data ??
          data?.list ??
          data?.attendances ??
          (Array.isArray(data) ? data : []);
        const list = Array.isArray(rawList)
          ? rawList
          : rawList?.list ?? rawList?.attendances ?? rawList?.items ?? rawList?.data ?? [];
        const normalized = Array.isArray(list) ? list : [];
        const mapped = mapTodayAttendancesToStatus(normalized);
        setSelectedDateAttendances(mapped);
      } catch (error) {
        setSelectedDateAttendances([]);
      }
    },
    [mapTodayAttendancesToStatus],
  );

  useEffect(() => {
    const initData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("username");
        const headers = await getAuthHeader();
        const profileRes = await api.get(`/api/v1/users/me`, {
          params: { username: storedUsername },
          headers,
        });
        const userData = profileRes.data.data || profileRes.data;
        if (userData.storeId) {
          const id = Number(userData.storeId);
          setCurrentStoreId(id);
          fetchTodayWeekSchedule(id);
          fetchWeeklySchedule(id, selectedDate);
          fetchTodayStatus(id);
        }
      } catch (e) {
        console.error("데이터 로드 실패");
      }
    };
    initData();
  }, [selectedDate, fetchWeeklySchedule, fetchTodayWeekSchedule, fetchTodayStatus]);

  // 과거 날짜 선택 시 해당 날짜 출퇴근 조회 → 그날 상태 색 유지
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (currentStoreId && selectedDate < todayStr) {
      fetchSelectedDateAttendances(currentStoreId, selectedDate);
    } else {
      setSelectedDateAttendances([]);
    }
  }, [currentStoreId, selectedDate, fetchSelectedDateAttendances]);

  // 알바생 출근/퇴근 실시간 반영 + 상단 당일 기록 유지: 화면 포커스 시 재조회
  useFocusEffect(
    useCallback(() => {
      if (currentStoreId) {
        fetchTodayStatus(currentStoreId);
        fetchTodayWeekSchedule(currentStoreId);
      }
    }, [currentStoreId, fetchTodayStatus, fetchTodayWeekSchedule])
  );

  // 같은 화면에 있는 동안 5초마다 출퇴근 목록 재조회
  useEffect(() => {
    if (!currentStoreId) return;
    const interval = setInterval(() => fetchTodayStatus(currentStoreId), 5000);
    return () => clearInterval(interval);
  }, [currentStoreId, fetchTodayStatus]);

  // --- 4. 필터링 및 핸들러 ---
  /** "HH:mm" 또는 "H:mm" → 분 단위(0~1440)로 변환해 정렬에 사용 */
  const timeToMinutes = (timeStr: string): number => {
    const s = (timeStr || "").trim();
    const match = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return 0;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h * 60 + m;
  };

  const isDeletedSlot = (item: ScheduleItem) => {
    const s = item.startTime ?? item.time?.split("~")?.[0]?.trim() ?? "";
    const e = item.endTime ?? item.time?.split("~")?.[1]?.trim() ?? "";
    return (s === "00:00" || s === "0:00") && (e === "00:00" || e === "0:00");
  };
  const startTime = (item: ScheduleItem) =>
    item.startTime ?? item.time?.split("~")?.[0]?.trim() ?? "00:00";
  const sortByStartTime = (list: ScheduleItem[]) =>
    [...list].sort((a, b) => timeToMinutes(startTime(a)) - timeToMinutes(startTime(b)));

  /** 상단 "아르바이트생 출퇴근 기록 확인" — 항상 당일만 (todayWeekSchedules 사용, 날짜 변경과 무관) */
  const todaySchedulesForAttendance = useMemo(() => {
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const today = new Date();
    const todayDay = dayNames[today.getDay()];
    const byDay = todayWeekSchedules.filter((item) => item.day === todayDay);
    const valid = byDay.filter((item) => !isDeletedSlot(item));
    return sortByStartTime(valid);
  }, [todayWeekSchedules]);

  /** 하단 "근무 수정" — 선택한 날짜(selectedDate) 기준 */
  const filteredSchedules = useMemo(() => {
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const currentDay = dayNames[new Date(selectedDate).getDay()];
    const byDay = weeklySchedules.filter((item) => item.day === currentDay);
    const valid = byDay.filter((item) => !isDeletedSlot(item));
    return sortByStartTime(valid);
  }, [selectedDate, weeklySchedules]);

  const handleEditPress = (worker: Worker, item: ScheduleItem) => {
    const timeParts = item.time?.split("~") || ["12:00", "18:00"];
    setSelectedUser({ name: worker.name, userId: worker.userId });
    setEditForm({
      scheduleId: worker.scheduleId,
      date: selectedDate, // 🌟 날짜 자동 고정
      start: item.startTime || timeParts[0]?.trim(),
      end: item.endTime || timeParts[1]?.trim(),
      breakTime: "30",
      isPlanned: false,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const headers = await getAuthHeader();
      const payload = {
        workDate: editForm.date,
        startTime: editForm.start,
        endTime: editForm.end,
        breakTime: parseInt(editForm.breakTime),
      };
      const response = await api.patch(
        `/api/v1/schedules/${editForm.scheduleId}`,
        payload,
        { headers },
      );
      if (response.data.success) {
        Alert.alert("성공", "수정되었습니다.", [
          { text: "확인", onPress: () => setShowEditModal(false) },
        ]);
        if (currentStoreId) {
          fetchWeeklySchedule(currentStoreId, selectedDate);
          fetchTodayWeekSchedule(currentStoreId);
        }
      }
    } catch (error) {
      Alert.alert("오류", "수정 중 에러가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header notificationCount={notificationCount} />
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 🌟 ✅ 아르바이트생 출퇴근 기록 확인 — 항상 당일만 표시 */}
        <Text style={styles.sectionTitle}>
          아르바이트생 출퇴근 기록 확인 ({new Date().toISOString().split("T")[0]})
        </Text>
        <View style={styles.sectionCard}>
          {todaySchedulesForAttendance.length > 0 ? (
            todaySchedulesForAttendance.map((item, idx) => (
              <View key={idx} style={styles.infoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>
                    {item.workers?.map((w) => w.name).join(", ")}
                  </Text>
                </View>
                <Text style={styles.timeText}>
                  {item.startTime && item.endTime
                    ? `${item.startTime} ~ ${item.endTime}`
                    : item.time}
                </Text>
                {/* 실시간 상태: 당일 근무인데 출퇴근 없으면 빨강, 퇴근 후에도 출근 시 색 유지 */}
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: getStatusColorForWorkDate(
                        new Date().toISOString().split("T")[0],
                        item.workers?.[0]?.name || "",
                        item.workers?.[0]?.userId,
                      ),
                    },
                  ]}
                />
              </View>
            ))
          ) : (
            <Text style={{ textAlign: "center", padding: 20, color: "#999" }}>
              기록이 없습니다.
            </Text>
          )}
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>근무 수정</Text>
          <TouchableOpacity
            onPress={() => setShowCalendar(true)}
            style={{ padding: 5 }}
          >
            <Ionicons name="calendar-outline" size={24} color="#A28BFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.daysHeader}>
            {weekDays.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => setSelectedDate(item.dateString)}
                style={{ alignItems: "center" }}
              >
                <Text
                  style={
                    item.dateString === selectedDate
                      ? styles.dayTextActive
                      : styles.dayText
                  }
                >
                  {item.label}
                </Text>
                <Text
                  style={
                    item.dateString === selectedDate
                      ? styles.dayTextActive
                      : { color: "#333", fontSize: 14, fontWeight: "600" }
                  }
                >
                  {item.dayNum}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {filteredSchedules.map((item, idx) =>
            item.workers?.map((worker, wIdx) => (
              <View key={`${idx}-${wIdx}`} style={styles.infoRow}>
                <TouchableOpacity
                  style={styles.nameBadge}
                  onPress={() => handleEditPress(worker, item)}
                >
                  <Text style={styles.nameBadgeText}>{worker.name}</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.timeText}>
                    {item.startTime && item.endTime
                      ? `${item.startTime} ~ ${item.endTime}`
                      : item.time}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: getStatusColorForWorkDate(
                        selectedDate,
                        worker.name,
                        worker.userId,
                      ),
                    },
                  ]}
                />
              </View>
            )),
          )}
        </View>
      </ScrollView>

      {/* 수정 모달 */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>근무 수정</Text>
                <View style={styles.userTag}>
                  <Text style={styles.userTagText}>{selectedUser?.name}</Text>
                </View>
              </View>
              <View style={styles.categoryGroup}>
                <TouchableOpacity
                  style={[
                    styles.categoryBtn,
                    !editForm.isPlanned && styles.categoryBtnActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, isPlanned: false })}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      !editForm.isPlanned && styles.categoryTextActive,
                    ]}
                  >
                    등록된 근무
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryBtn,
                    editForm.isPlanned && styles.categoryBtnActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, isPlanned: true })}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      editForm.isPlanned && styles.categoryTextActive,
                    ]}
                  >
                    기록된 근무
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>근무 시간</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={[
                      styles.timeInput,
                      { color: editForm.start ? "#000" : "#999" }, // 값이 있으면 검은색, 없으면 회색
                    ]}
                    value={editForm.start}
                    onChangeText={(t) =>
                      setEditForm({ ...editForm, start: formatTime(t) })
                    }
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder="시작 시간"
                  />
                  <Text style={{ marginHorizontal: 10, color: "#999" }}>~</Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      { color: editForm.end ? "#000" : "#999" }, // 값이 있으면 검은색, 없으면 회색
                    ]}
                    value={editForm.end}
                    onChangeText={(t) =>
                      setEditForm({ ...editForm, end: formatTime(t) })
                    }
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder="종료 시간"
                  />
                </View>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>휴게 시간 (분)</Text>
                <View style={styles.breakTimeGroup}>
                  {["0", "30", "60"].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.breakTimeBtn,
                        editForm.breakTime === t && styles.breakTimeBtnActive,
                      ]}
                      onPress={() => setEditForm({ ...editForm, breakTime: t })}
                    >
                      <Text
                        style={
                          editForm.breakTime === t
                            ? { color: "#000" }
                            : { color: "#333" }
                        }
                      >
                        {t}분
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalBtnGroup}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.submitBtnText}>수정 완료</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomDatePicker
        visible={showCalendar}
        value={selectedDate}
        onDateChange={(d: string) => {
          setSelectedDate(d);
          setShowCalendar(false);
        }}
        onClose={() => setShowCalendar(false)}
      />
      <Footer />
    </SafeAreaView>
  );
};

export default AttendancePage;
