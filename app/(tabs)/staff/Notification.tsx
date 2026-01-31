import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import type { NotificationItemData } from "../../../components/notification/StaffData";
import { NotificationItem } from "../../../components/notification/StaffNotification";
import api from "../../../constants/api";
import { fetchModifications } from "../../../services/modificationApi";
import { styles } from "../../../styles/tabs/staff/Notification";

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

const STAFF_READ_IDS_KEY = "staff_read_notification_ids";

export default function StaffNotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [loading, setLoading] = useState(true);

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
      const meRes = await api.get("/api/v1/users/me", { params: { username }, headers });
      const me = meRes.data?.data ?? meRes.data;
      const userId = me?.userId ?? me?.id ?? null;
      const storeId = me?.storeId ?? null;
      if (userId == null) {
        setNotifications([]);
        return;
      }
      const uid = Number(userId);
      const items: NotificationItemData[] = [];
      let idGen = 1;

      const [modList, salaryRes, attRes, scheduleRes] = await Promise.all([
        storeId != null
          ? fetchModifications({ storeId: Number(storeId), requesterId: uid, status: "APPROVED" }, headers).catch(() => [])
          : Promise.resolve([]),
        api.get("/api/v1/salary/history", { params: { userId: uid }, headers }).catch(() => ({ data: [] })),
        api.get("/api/v1/attendances/monthly", {
          params: { userId: uid, year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
          headers,
        }).catch(() => ({ data: {} })),
        api.get("/api/v1/schedules/my-weekly", { params: { username }, headers }).catch(() => ({ data: {} })),
      ]);

      for (const m of modList) {
        // 승인된 시각(updatedAt)이 있으면 그걸로 표시 → 방금 승인된 건 '방금 전'으로 보이게
        const timeSource = m.updatedAt ?? m.createdAt;
        items.push({
          id: idGen++,
          icon: "✅",
          name: "정정 승인",
          message: "요청하신 스케줄 정정 건이 승인되었습니다.",
          time: formatRelativeTime(timeSource),
          category: getCategory(timeSource),
          isRead: false,
        });
      }

      const salaryList = Array.isArray(salaryRes.data) ? salaryRes.data : salaryRes.data?.data ?? salaryRes.data?.list ?? [];
      for (const s of salaryList) {
        const status = String(s?.status ?? "").toUpperCase();
        if (status !== "COMPLETED") continue;
        const year = s.year ?? new Date().getFullYear();
        const month = s.month ?? new Date().getMonth() + 1;
        const amount = s.amount ?? s.totalAmount ?? 0;
        const amountStr = typeof amount === "number" ? `${amount.toLocaleString()}원` : String(amount);
        const completedAt = s.completedAt ?? s.updatedAt;
        items.push({
          id: idGen++,
          icon: "💰",
          name: "급여 입금",
          message: `${month}월 급여 ${amountStr}이 입금되었습니다.`,
          time: formatRelativeTime(completedAt),
          category: getCategory(completedAt),
          isRead: false,
        });
        const payslipSentAt = s.payslipSentAt ?? s.payslipSentDate ?? (s.payslipSent ? completedAt : null);
        const payslipTime = payslipSentAt ?? completedAt;
        items.push({
          id: idGen++,
          icon: "📧",
          name: "임금 명세서",
          message: `${month}월 임금 명세서가 발송되었습니다. 이메일을 확인해 주세요.`,
          time: formatRelativeTime(payslipTime),
          category: getCategory(payslipTime),
          isRead: false,
        });
      }

      const attPayload = attRes.data?.data ?? attRes.data;
      const attList = Array.isArray(attPayload) ? attPayload : attPayload?.list ?? attPayload?.data ?? [];
      for (const a of attList) {
        const startTime = a.startTime ?? a.checkInTime;
        const endTime = a.endTime ?? a.checkOutTime;
        const totalHours = a.totalHours;
        if (startTime) {
          const timePart = startTime.includes("T") ? startTime.slice(11, 16) : String(startTime).slice(0, 5);
          const isLate = String(a?.status ?? "").toUpperCase() === "LATE";
          items.push({
            id: idGen++,
            icon: "⏰",
            name: "출근",
            message: isLate ? `(${timePart}) 지각 출근 처리되었습니다.` : `(${timePart}) 출근 체크 완료! 오늘도 기분 좋은 하루 보내세요.`,
            time: formatRelativeTime(startTime),
            category: getCategory(startTime),
            isRead: false,
          });
        }
        if (endTime) {
          const timePart = endTime.includes("T") ? endTime.slice(11, 16) : String(endTime).slice(0, 5);
          const hoursText = totalHours != null ? ` 총 ${Math.round(totalHours * 10) / 10}시간 근무했습니다.` : "";
          items.push({
            id: idGen++,
            icon: "🏠",
            name: "퇴근",
            message: `(${timePart}) 퇴근 체크 완료! 고생하셨습니다.${hoursText}`,
            time: formatRelativeTime(endTime),
            category: getCategory(endTime),
            isRead: false,
          });
        }
      }

      const schedPayload = scheduleRes.data?.data ?? scheduleRes.data;
      const schedList = Array.isArray(schedPayload) ? schedPayload : schedPayload?.list ?? schedPayload?.items ?? [];
      if (schedList.length > 0) {
        items.push({
          id: idGen++,
          icon: "📅",
          name: "스케줄",
          message: "새로운 근무 스케줄이 등록되었습니다.",
          time: "오늘",
          category: "오늘",
          isRead: false,
        });
      }

      const order: Record<string, number> = { 오늘: 0, 어제: 1, "이번 주": 2 };
      items.sort((a, b) => (order[a.category] ?? 2) - (order[b.category] ?? 2));
      try {
        const raw = await AsyncStorage.getItem(STAFF_READ_IDS_KEY);
        const readIds: number[] = raw ? JSON.parse(raw) : [];
        const readSet = new Set(readIds);
        items.forEach((n) => {
          if (readSet.has(n.id)) n.isRead = true;
        });
      } catch (_) {}
      setNotifications(items);
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
        const raw = await AsyncStorage.getItem(STAFF_READ_IDS_KEY);
        const readIds: number[] = raw ? JSON.parse(raw) : [];
        if (!readIds.includes(id)) {
          readIds.push(id);
          await AsyncStorage.setItem(STAFF_READ_IDS_KEY, JSON.stringify(readIds));
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
        const raw = await AsyncStorage.getItem(STAFF_READ_IDS_KEY);
        const readIds: number[] = raw ? JSON.parse(raw) : [];
        const set = new Set(readIds);
        ids.forEach((id) => set.add(id));
        await AsyncStorage.setItem(STAFF_READ_IDS_KEY, JSON.stringify([...set]));
      } catch (_) {}
    })();
  };

  const todayNotifications = useMemo(() => notifications.filter((n) => n.category === "오늘"), [notifications]);
  const yesterdayNotifications = useMemo(() => notifications.filter((n) => n.category === "어제"), [notifications]);
  const thisWeekNotifications = useMemo(() => notifications.filter((n) => n.category === "이번 주"), [notifications]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
        {todayNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>오늘</Text>
            {todayNotifications.map((n) => (
              <NotificationItem key={n.id} data={n} onPress={() => handleNotificationPress(n.id)} />
            ))}
          </View>
        )}
        {yesterdayNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>어제</Text>
            {yesterdayNotifications.map((n) => (
              <NotificationItem key={n.id} data={n} onPress={() => handleNotificationPress(n.id)} />
            ))}
          </View>
        )}
        {thisWeekNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>이번 주</Text>
            {thisWeekNotifications.map((n) => (
              <NotificationItem key={n.id} data={n} onPress={() => handleNotificationPress(n.id)} />
            ))}
          </View>
        )}
        {notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>새로운 알림이 없습니다</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
