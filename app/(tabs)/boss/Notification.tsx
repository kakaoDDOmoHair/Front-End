import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { BossNotificationItemData } from "../../../components/notification/BossData";
import { BossNotificationItem } from "../../../components/notification/BossNotification";
import api from "../../../constants/api";
import {
  fetchModifications,
  updateModificationStatus,
  type ModificationRequestItem,
} from "../../../services/modificationApi";
import { styles } from "../../../styles/tabs/boss/Notification";

const BOSS_READ_IDS_KEY = "boss_read_notification_ids";

/** createdAt → "2시간 전" 스타일 */
function formatRelativeTime(createdAt?: string): string {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return "방금 전";
  if (diffM < 60) return `${diffM}분 전`;
  if (diffH < 24) return `${diffH}시간 전`;
  if (diffD === 1) return "하루 전";
  if (diffD < 7) return `${diffD}일 전`;
  return "이번 주";
}

/** 날짜 기준 오늘/어제/이번 주 */
function getCategory(createdAt?: string): "오늘" | "어제" | "이번 주" {
  if (!createdAt) return "이번 주";
  const date = new Date(createdAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const then = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffD = Math.floor((today.getTime() - then.getTime()) / 86400000);
  if (diffD === 0) return "오늘";
  if (diffD === 1) return "어제";
  return "이번 주";
}

/** 정정 요청 API 항목 → BossNotificationItemData (수정/삭제 구분) */
function mapToModificationItem(item: ModificationRequestItem): BossNotificationItemData {
  const name = item.requesterName || "알바생";
  const isDelete = item.requestType === "DELETE";
  const actionText = isDelete ? "삭제 요청이 들어왔습니다" : "수정 요청이 들어왔습니다";
  const typeLabel = item.targetType === "ATTENDANCE" ? "근무 시간" : "스케줄";
  const value = item.afterValue && !isDelete ? ` (${item.afterValue})` : "";
  const reason = item.reason ? ` 사유: ${item.reason}` : "";
  const message = `${name}님이 ${actionText}. ${item.targetDate} ${typeLabel}${value}${reason}`;
  // 수락/거절한 시각(updatedAt)이 있으면 그걸로 표시 → 방금 처리한 건 '방금 전'으로 보이게
  const timeSource = (item.status === "APPROVED" || item.status === "REJECTED") && item.updatedAt
    ? item.updatedAt
    : item.createdAt;
  return {
    id: item.requestId,
    icon: "⏰",
    name: isDelete ? "삭제 요청" : "수정 요청",
    message,
    time: formatRelativeTime(timeSource),
    category: getCategory(timeSource),
    isRead: false,
    hasActions: true,
  };
}

/** 급여 정산 요청(REQUESTED) → BossNotificationItemData (id는 1000000+userId로 정정 요청과 구분) */
function mapSalaryRequestToItem(worker: { userId: number; name?: string }): BossNotificationItemData {
  const workerName = worker.name || "알바생";
  return {
    id: 1000000 + worker.userId,
    icon: "💰",
    name: "정산",
    message: `${workerName}님이 급여 정산을 요청했습니다. 급여 페이지에서 확인하세요.`,
    time: "오늘",
    category: "오늘",
    isRead: false,
    hasActions: false,
  };
}

/** 오늘 출퇴근 기록 → 출근/지각/퇴근 알림 (id: 2xxxxxx 고유 증가) */
function mapAttendancesToItems(list: Array<Record<string, unknown> & { userId: number; name?: string; status?: string }>): BossNotificationItemData[] {
  const items: BossNotificationItemData[] = [];
  let idBase = 2000000;
  for (const a of list) {
    const name = a.name || "알바생";
    const status = String(a?.status ?? "").toUpperCase();
    const startTime = (a.startTime ?? a.checkInTime ?? a.start_time ?? a.check_in_time) as string | undefined;
    const endTime = (a.endTime ?? a.checkOutTime ?? a.end_time ?? a.check_out_time) as string | undefined;
    const totalHours = (a.totalHours ?? a.total_hours) as number | undefined;
    const hasClockedIn = status === "ON" || status === "LATE";
    const hasClockedOut = status === "OFF" || status === "ABSENT" || !!endTime;
    if (startTime) {
      const timePart = startTime.includes("T") ? startTime.slice(11, 16) : String(startTime).slice(0, 5);
      const isLate = status === "LATE";
      items.push({
        id: idBase++,
        icon: isLate ? "⚠️" : "⏰",
        name: isLate ? "지각" : "출근",
        message: isLate
          ? `${name}님이 예정된 시간보다 늦게 출근했습니다. (${timePart})`
          : `${name}님이 출근했습니다. (${timePart})`,
        time: formatRelativeTime(startTime),
        category: getCategory(startTime),
        isRead: false,
        hasActions: false,
      });
    } else if (hasClockedIn) {
      items.push({
        id: idBase++,
        icon: status === "LATE" ? "⚠️" : "⏰",
        name: status === "LATE" ? "지각" : "출근",
        message: status === "LATE"
          ? `${name}님이 예정된 시간보다 늦게 출근했습니다.`
          : `${name}님이 출근했습니다.`,
        time: "오늘",
        category: "오늘",
        isRead: false,
        hasActions: false,
      });
    }
    if (endTime) {
      const endTimePart = endTime.includes("T") ? endTime.slice(11, 16) : String(endTime).slice(0, 5);
      const hoursText = totalHours != null ? ` 총 ${Math.round(totalHours * 10) / 10}시간 근무.` : ".";
      items.push({
        id: idBase++,
        icon: "🏠",
        name: "퇴근",
        message: `${name}님이 ${endTimePart}에 퇴근했습니다.${hoursText}`,
        time: formatRelativeTime(endTime),
        category: getCategory(endTime),
        isRead: false,
        hasActions: false,
      });
    } else if (hasClockedOut && !startTime) {
      items.push({
        id: idBase++,
        icon: "🏠",
        name: "퇴근",
        message: `${name}님이 퇴근했습니다.`,
        time: "오늘",
        category: "오늘",
        isRead: false,
        hasActions: false,
      });
    }
  }
  return items;
}

/** 이번 주 시작일 (일요일) YYYY-MM-DD */
function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  return sunday.toISOString().split("T")[0];
}

const DAY_ORDER = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** 주간 스케줄 → "OO님이 근무를 등록했습니다" 알림 (id: 5xxxxxx) */
function mapSchedulesToItems(
  list: Array<Record<string, unknown> & { scheduleId?: number; workDate?: string; date?: string; day?: string; time?: string; startTime?: string; endTime?: string; createdAt?: string; workers?: Array<{ name?: string }> }>,
  startDate: string
): BossNotificationItemData[] {
  const items: BossNotificationItemData[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  let idBase = 5000000;
  const seen = new Set<string>();
  for (const s of list) {
    let workDate = s.workDate ?? s.date as string | undefined;
    if (!workDate && s.day) {
      const dayIndex = DAY_ORDER.indexOf(String(s.day).toUpperCase());
      if (dayIndex >= 0) {
        const start = new Date(startDate);
        start.setDate(start.getDate() + dayIndex);
        workDate = start.toISOString().split("T")[0];
      }
    }
    const createdAt = s.createdAt as string | undefined;
    const timeStr = s.time ?? (s.startTime && s.endTime ? `${s.startTime}~${s.endTime}` : "");
    const workerName = (s.workers && s.workers[0]?.name) ? s.workers[0].name : "알바생";
    const dateLabel = workDate ? `${String(workDate).slice(5, 7)}월 ${String(workDate).slice(8, 10)}일` : "";
    const msg = timeStr
      ? `${workerName}님이 ${dateLabel} 근무를 등록했습니다. (${timeStr})`
      : `${workerName}님이 ${dateLabel} 근무를 등록했습니다.`;
    const key = `${workDate}-${s.scheduleId ?? idBase}-${workerName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (createdAt) {
      const created = new Date(createdAt);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      if (created >= threeDaysAgo) {
        items.push({
          id: idBase++,
          icon: "📅",
          name: "스케줄",
          message: msg,
          time: formatRelativeTime(createdAt),
          category: getCategory(createdAt),
          isRead: false,
          hasActions: false,
        });
      }
    } else if (workDate && workDate >= todayStr) {
      items.push({
        id: idBase++,
        icon: "📅",
        name: "스케줄",
        message: msg,
        time: workDate === todayStr ? "오늘" : formatRelativeTime(workDate),
        category: getCategory(workDate),
        isRead: false,
        hasActions: false,
      });
    }
  }
  return items;
}

export default function BossNotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<BossNotificationItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setStoreId] = useState<number | null>(null);

  const getAuthHeader = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const token = await AsyncStorage.getItem("user_token");
      if (token) return { Authorization: `Bearer ${token}` };
      return {};
    } catch {
      return {};
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        setNotifications([]);
        return;
      }
      const headers = await getAuthHeader();
      const meRes = await api.get("/api/v1/users/me", {
        params: { username },
        headers,
      });
      const sid = meRes.data?.storeId ?? meRes.data?.data?.storeId;
      if (sid == null) {
        setStoreId(null);
        setNotifications([]);
        return;
      }
      const id = Number(sid);
      setStoreId(id);
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const weekStart = getWeekStartDate();
      const [modList, salaryRes, attendancesRes, storeRes, schedulesRes] = await Promise.all([
        fetchModifications({ storeId: id, status: "PENDING" }, headers).catch(() => []),
        api.get("/api/v1/salary/monthly", {
          params: { storeId: id, year, month },
          headers,
        }),
        api.get("/api/v1/attendances/today", { params: { storeId: id }, headers }),
        api.get(`/api/v1/stores/${id}`, { headers }).catch(() => ({ data: {} })),
        api.get("/api/v1/schedules/weekly", { params: { storeId: id, startDate: weekStart }, headers }).catch(() => ({ data: [] })),
      ]);
      const modificationItems = modList.map(mapToModificationItem);
      const dataRoot = salaryRes.data?.data ?? salaryRes.data;
      const workers = dataRoot?.payments ?? dataRoot?.workers ?? [];
      const requestedWorkers = workers.filter(
        (w: { status?: string }) => String(w?.status ?? "").toUpperCase() === "REQUESTED"
      );
      const salaryItems = requestedWorkers.map((w: { userId: number; name?: string }) =>
        mapSalaryRequestToItem(w)
      );
      const attPayload = attendancesRes.data?.data ?? attendancesRes.data;
      const attList = attPayload?.list ?? attPayload?.attendances ?? attPayload?.items ?? [];
      const attendanceItems = mapAttendancesToItems(Array.isArray(attList) ? attList : []);

      const schedPayload = schedulesRes.data?.data ?? schedulesRes.data;
      const schedList = Array.isArray(schedPayload) ? schedPayload : schedPayload?.list ?? schedPayload?.items ?? [];
      const scheduleItems = mapSchedulesToItems(schedList as Parameters<typeof mapSchedulesToItems>[0], weekStart);

      const paydayItems: BossNotificationItemData[] = [];
      const storeData = storeRes.data?.data ?? storeRes.data;
      const payDay = storeData?.payDay ?? storeData?.payDate;
      const dashboardRes = await api.get("/api/v1/stores/dashboard", {
        params: { storeId: id, year, month },
        headers,
      }).catch(() => ({ data: {} }));
      const payDateStr = dashboardRes.data?.payDate ?? storeData?.payDate ?? null;
      let daysUntilPay = -1;
      if (payDateStr && typeof payDateStr === "string") {
        const parts = payDateStr.split("-");
        if (parts.length >= 3) {
          const payDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          daysUntilPay = Math.ceil((payDate.getTime() - today.getTime()) / 86400000);
        }
      } else if (typeof payDay === "number" && payDay >= 1 && payDay <= 31) {
        const today = now.getDate();
        let nextPay = new Date(now.getFullYear(), now.getMonth(), payDay);
        if (nextPay.getTime() < now.getTime()) nextPay = new Date(now.getFullYear(), now.getMonth() + 1, payDay);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        daysUntilPay = Math.ceil((nextPay.getTime() - todayStart.getTime()) / 86400000);
      }
      if (daysUntilPay >= 0 && daysUntilPay <= 3) {
        const msg = daysUntilPay === 0
          ? "사장님, 오늘은 급여 정산일입니다!"
          : daysUntilPay === 1
            ? "사장님, 내일은 급여 정산일입니다!"
            : `사장님, ${daysUntilPay}일 뒤는 급여 정산일입니다!`;
        paydayItems.push({
          id: 4000000,
          icon: "📅",
          name: "안내",
          message: msg,
          time: "오늘",
          category: "오늘",
          isRead: false,
          hasActions: false,
        });
      }
      const combined = [...modificationItems, ...salaryItems, ...attendanceItems, ...scheduleItems, ...paydayItems];
      const order: Record<string, number> = { 오늘: 0, 어제: 1, "이번 주": 2 };
      combined.sort((a, b) => (order[a.category] ?? 2) - (order[b.category] ?? 2));
      try {
        const raw = await AsyncStorage.getItem(BOSS_READ_IDS_KEY);
        const readIds: number[] = raw ? JSON.parse(raw) : [];
        const readSet = new Set(readIds);
        combined.forEach((n) => {
          if (readSet.has(n.id)) n.isRead = true;
        });
      } catch (_) {}
      setNotifications(combined);
    } catch (e) {
      console.error("알림 목록 조회 실패:", e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BOSS_READ_IDS_KEY);
        const readIds: number[] = raw ? JSON.parse(raw) : [];
        if (!readIds.includes(id)) {
          readIds.push(id);
          await AsyncStorage.setItem(BOSS_READ_IDS_KEY, JSON.stringify(readIds));
        }
      } catch (_) {}
    })();
  };

  const handleMarkAllRead = () => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BOSS_READ_IDS_KEY);
        const readIds: number[] = raw ? JSON.parse(raw) : [];
        const set = new Set(readIds);
        ids.forEach((id) => set.add(id));
        await AsyncStorage.setItem(BOSS_READ_IDS_KEY, JSON.stringify([...set]));
      } catch (_) {}
    })();
  };

  const handleApprove = async (id: number) => {
    if (id >= 1000000) return; // 정산 요청 알림은 승인 버튼 없음
    try {
      const headers = await getAuthHeader();
      await updateModificationStatus(id, { status: "APPROVED" }, headers);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      Alert.alert("승인 완료", "알바생에게 수정 요청 승인 알림을 보냈습니다.");
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      if (status === 401) {
        console.warn("[401] 수정 요청 승인 실패 (PATCH .../status). 위 [401 디버깅] 로그 확인.", data);
        const msg = data?.message ?? "로그인이 필요합니다.";
        Alert.alert("로그인 필요", msg, [
          { text: "확인", style: "cancel" },
          { text: "로그인하기", onPress: () => router.replace("/(auth)/Login") },
        ]);
      } else if (status === 403) {
        Alert.alert("권한 없음", data?.message ?? "승인/거절은 사장님만 가능합니다.");
      } else {
        console.error("승인 처리 실패:", e);
        Alert.alert("오류", data?.message ?? "승인 처리에 실패했습니다.");
      }
    }
  };

  const handleReject = (id: number) => {
    if (id >= 1000000) return;
    Alert.alert("요청 거절", "정말 거절하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "거절",
        style: "destructive",
        onPress: async () => {
          try {
            const headers = await getAuthHeader();
            await updateModificationStatus(id, { status: "REJECTED" }, headers);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            Alert.alert("거절 완료", "요청을 거절했습니다.");
          } catch (e: any) {
            const status = e?.response?.status;
            const data = e?.response?.data;
            if (status === 401) {
              console.warn("[401] 수정 요청 거절 실패 (PATCH .../status). 위 [401 디버깅] 로그 확인.", data);
              const msg = data?.message ?? "로그인이 필요합니다.";
              Alert.alert("로그인 필요", msg, [
                { text: "확인", style: "cancel" },
                { text: "로그인하기", onPress: () => router.replace("/(auth)/Login") },
              ]);
            } else if (status === 403) {
              Alert.alert("권한 없음", data?.message ?? "승인/거절은 사장님만 가능합니다.");
            } else {
              console.error("거절 처리 실패:", e);
              Alert.alert("오류", data?.message ?? "거절 처리에 실패했습니다.");
            }
          }
        },
      },
    ]);
  };

  const todayNotifications = useMemo(
    () => notifications.filter((n) => n.category === "오늘"),
    [notifications]
  );
  const yesterdayNotifications = useMemo(
    () => notifications.filter((n) => n.category === "어제"),
    [notifications]
  );
  const thisWeekNotifications = useMemo(
    () => notifications.filter((n) => n.category === "이번 주"),
    [notifications]
  );

  const renderSection = (
    title: string,
    data: BossNotificationItemData[]
  ) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{title}</Text>
        {data.map((n) => (
          <BossNotificationItem
            key={n.id}
            data={n}
            onPress={() => handleNotificationPress(n.id)}
            onApprove={n.hasActions ? handleApprove : undefined}
            onReject={n.hasActions ? handleReject : undefined}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.pageHeaderTitle}>알림 센터</Text>
          <TouchableOpacity onPress={handleMarkAllRead} style={{ minWidth: 72 }}>
            <Text style={styles.markAllReadText}>모두 읽음</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.pageHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.pageHeaderTitle}>알림 센터</Text>
        <TouchableOpacity onPress={handleMarkAllRead} style={{ minWidth: 72 }}>
          <Text style={styles.markAllReadText}>모두 읽음</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSection("오늘", todayNotifications)}
        {renderSection("어제", yesterdayNotifications)}
        {renderSection("이번 주", thisWeekNotifications)}
        {notifications.length === 0 && (
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontSize: 15, color: "#666" }}>
              대기 중인 알림이 없습니다.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
