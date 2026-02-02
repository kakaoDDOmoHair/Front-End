import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { useSetUnreadNotification, useTriggerNotificationRefetch } from "../../../contexts/UnreadNotificationContext";
import { fetchModifications } from "../../../services/modificationApi";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type BackendNotificationItem,
} from "../../../services/notificationApi";
import { styles } from "../../../styles/tabs/staff/Notification";
import { formatStaffAttendanceMessage } from "../../../utils/notificationMessage";
import { formatRelativeTime, getCategory, getSortTimestamp, parseDateForRelative } from "../../../utils/relativeTime";

/** 회원가입 이전·과거 알림 제외: 최근 N일만 표시 (정렬/표시 일치) */
const NOTIFICATION_MAX_AGE_DAYS = 90;
const NOTIFICATION_MAX_AGE_MS = NOTIFICATION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function filterRecentOnly<T extends { sortAt?: string | number }>(items: T[]): T[] {
  const cutoff = Date.now() - NOTIFICATION_MAX_AGE_MS;
  return items.filter((n) => getSortTimestamp(n.sortAt) >= cutoff);
}

/** 출퇴근 시간 표시: ISO(UTC)면 로컬 HH:mm으로, "HH:mm" 형태면 그대로 */
function formatTimeForDisplay(timeStr?: string): string {
  if (!timeStr || typeof timeStr !== "string") return "";
  const s = String(timeStr).trim();
  if (s.includes("T")) {
    const date = parseDateForRelative(s);
    if (date) {
      const h = date.getHours();
      const m = date.getMinutes();
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  return s.slice(0, 5);
}

const STAFF_READ_KEYS_PREFIX = "staff_read_notification_keys";
const STAFF_READ_KEYS_LEGACY = "staff_read_notification_keys";

/** 사용자별 읽음 키 → 로그인 새로 해도 같은 사용자 읽음 유지 */
function getStaffReadKeysKey(username: string): string {
  return username ? `${STAFF_READ_KEYS_PREFIX}_${username}` : STAFF_READ_KEYS_LEGACY;
}

/** salary/history 응답의 month: 숫자(1~12) 또는 "1월" 등 문자열 모두 처리 */
function parseSalaryMonth(s: { month?: unknown }): number {
  const m = s?.month;
  if (typeof m === "number" && m >= 1 && m <= 12) return m;
  if (typeof m === "string") {
    const match = m.match(/^(\d{1,2})/);
    if (match) return parseInt(match[1], 10);
  }
  return new Date().getMonth() + 1;
}

function typeToIcon(type?: string): string {
  const t = (type || "").toUpperCase();
  if (t === "ATTENDANCE") return "⏰";
  if (t === "PAYMENT" || t === "PAY") return "💰";
  if (t === "WORK" || t === "SCHEDULE") return "📅";
  if (t === "MODIFICATION" || t === "APPROVAL") return "✅";
  return "🔔";
}

/** 출퇴근 알림인지 여부 (메시지에 UTC (HH:mm)가 들어가 로컬 시간으로 바꿔야 할 때) */
function isAttendanceBackendNotification(n: BackendNotificationItem): boolean {
  const type = (n.type || "").toUpperCase();
  if (type === "ATTENDANCE") return true;
  const msg = (n.message || "") + (n.title || "");
  return /출석|출근|퇴근|체크\s*완료/.test(msg);
}

/** 백엔드 알림 → 표시 시간·정렬 모두 createdAt 기준. 출퇴근 알림은 메시지 안 (HH:mm)을 로컬 시각으로 치환 */
function mapBackendToItem(n: BackendNotificationItem): NotificationItemData {
  let message = n.message || "";
  if (isAttendanceBackendNotification(n) && n.createdAt) {
    const localTime = formatTimeForDisplay(n.createdAt);
    if (localTime) {
      message = message.replace(/\(\d{1,2}:\d{2}\)/, `(${localTime})`);
    }
  }
  return {
    id: n.id,
    icon: typeToIcon(n.type),
    name: n.title || "알림",
    message,
    time: formatRelativeTime(n.createdAt),
    category: getCategory(n.createdAt),
    isRead: n.isRead,
    sortAt: n.createdAt,
    readKey: `backend-${n.id}`,
  };
}

/** 사장님 전용 알림(알바생에게는 노출하지 않음): 급여 정산 요청 등 */
function isBossOnlyNotification(n: BackendNotificationItem): boolean {
  const type = (n.type || "").toUpperCase();
  if (type === "SALARY_REQUEST" || type === "PAYMENT_REQUEST" || type === "정산요청") return true;
  const msg = (n.message || "") + (n.title || "");
  if (msg.includes("급여 정산을 요청했습니다") || msg.includes("정산을 요청했습니다")) return true;
  return false;
}

/** 백엔드 "임금명세서 발송 완료" 알림 → salary/history 기반 "임금 명세서"로 통합하므로 제외 */
function isBackendPayslipDuplicate(n: BackendNotificationItem): boolean {
  const title = (n.title || "").toString().trim();
  const msg = (n.message || "").toString();
  if (/임금명세서\s*발송\s*완료|명세서.*발송.*완료/i.test(title)) return true;
  if ((n.type || "").toUpperCase() === "PAYSLIP" && /이메일.*발송|발송.*되었습니다/i.test(msg)) return true;
  return false;
}

export default function StaffNotificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [useBackendList, setUseBackendList] = useState(false);
  const setStaffUnread = useSetUnreadNotification("staff");
  const triggerNotificationRefetch = useTriggerNotificationRefetch();

  const handleBack = () => {
    try {
      const returnTo = typeof params.returnTo === "string" ? decodeURIComponent(params.returnTo) : "";
      if (returnTo && returnTo.includes("/staff/") && !returnTo.includes("/Notification")) {
        router.replace(returnTo as any);
        return;
      }
    } catch (_) {}
    router.back();
  };

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
      const backendList = await fetchNotifications(headers);
      const staffList = backendList.filter(
        (n) => !isBossOnlyNotification(n) && !isBackendPayslipDuplicate(n)
      );
      if (__DEV__) {
        console.log("[알림] GET /notifications 응답 개수:", backendList.length, "| staff 필터 후:", staffList.length);
        if (staffList.length > 0) console.log("[알림] 사용 경로: backend (GET /notifications)");
      }
      if (staffList.length > 0) {
        let list = staffList;
        const meRes = await api.get("/api/v1/users/me", { params: { username }, headers }).catch(() => null);
        const me = meRes?.data?.data ?? meRes?.data;
        const myUserId = me?.userId ?? me?.id;
        // 본인 알림만: userId 있으면 본인 것만, 없으면(공통 알림) 유지. 다른 알바생 출퇴근 알림 제거
        if (myUserId != null) {
          list = list.filter((n: any) => {
            const nUid = n.userId ?? n.user_id;
            if (nUid == null) return true;
            return Number(nUid) === Number(myUserId);
          });
        }
        const items = list.map(mapBackendToItem);
        // backend에 명세서 알림이 없을 수 있음 → salary/history payslipSentAt으로 병합
        const uid = myUserId != null ? Number(myUserId) : null;
        if (uid != null) {
          try {
            const salaryRes = await api.get("/api/v1/salary/history", { params: { userId: uid }, headers }).catch(() => ({ data: [] }));
            const salaryList = Array.isArray(salaryRes.data) ? salaryRes.data : salaryRes.data?.data ?? salaryRes.data?.list ?? [];
            let idGen = items.length > 0 ? Math.max(...items.map((n) => n.id)) + 1 : 1;
            for (const s of salaryList) {
              const status = String(s?.status ?? "").toUpperCase();
              const year = s.year ?? new Date().getFullYear();
              const month = parseSalaryMonth(s);
              const completedAt = s.completedAt ?? s.completed_at ?? s.updatedAt ?? s.updated_at ?? s.createdAt ?? s.created_at ?? s.sentAt ?? s.sent_at ?? s.paidAt ?? s.paid_at ?? s.processedAt ?? s.processed_at;
              const completedAtStr = typeof completedAt === "string" ? completedAt : typeof completedAt === "number" ? new Date(completedAt).toISOString() : "";
              const sortAt1 = completedAtStr || `${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`;
              // 백엔드: payslipSentAt(KST ISO 8601) — 발송 시 저장·반환. null이면 미발송
              const payslipSentAt = s.payslipSentAt ?? s.payslip_sent_at ?? s.payslipSentDate ?? s.payslip_sent_date ?? s.sentAt ?? s.sent_at ?? (s.payslipSent ? completedAt : null);
              const payslipTimeStr = typeof payslipSentAt === "string" ? payslipSentAt : typeof payslipSentAt === "number" ? new Date(payslipSentAt).toISOString() : "";
              if (payslipTimeStr) {
                // payslipSentAt 있으면 그대로 사용 → "N분 전" 정확히 표시 (백엔드 구현 반영)
                const payslipSortAt = payslipTimeStr;
                const payslipStableTime = payslipTimeStr.replace(/\.\d{3}Z?$/i, "").slice(0, 19);
                const payslipReadKey = `payslip-${year}-${month}-${payslipStableTime}`;
                const payslipTimeLabel = formatRelativeTime(payslipTimeStr);
                const alreadyHas = items.some((n) => n.readKey === payslipReadKey);
                if (!alreadyHas) {
                  items.push({
                    id: idGen++,
                    icon: "📧",
                    name: "임금 명세서",
                    message: `사장님이 ${month}월 임금 명세서를 발송했습니다. 이메일을 확인해 주세요.`,
                    time: payslipTimeLabel,
                    category: getCategory(payslipSortAt),
                    isRead: false,
                    sortAt: payslipSortAt,
                    readKey: payslipReadKey,
                  });
                }
              }
            }
          } catch (_) {}
        }
        // 최신 알림이 상단에 오도록 정렬
        items.sort((a, b) => getSortTimestamp(b.sortAt) - getSortTimestamp(a.sortAt));
        const recentItems = filterRecentOnly(items);
        // AsyncStorage 읽음 적용 → 로그인 새로 해도 같은 사용자 읽음 유지
        try {
          const raw = await AsyncStorage.getItem(getStaffReadKeysKey(username));
          let readKeys: string[] = raw ? JSON.parse(raw) : [];
          if (readKeys.length === 0) {
            const legacyRaw = await AsyncStorage.getItem(STAFF_READ_KEYS_LEGACY);
            if (legacyRaw) {
              readKeys = JSON.parse(legacyRaw);
              await AsyncStorage.setItem(getStaffReadKeysKey(username), JSON.stringify(readKeys));
            }
          }
          const readSet = new Set(readKeys);
          recentItems.forEach((n) => {
            if (n.readKey && readSet.has(n.readKey)) n.isRead = true;
          });
        } catch (_) {}
        if (__DEV__) {
          const payslipInBackend = recentItems.filter((n) => n.name === "임금 명세서" || /명세서/.test(n.message ?? ""));
          console.log("[알림] backend 경로 최종:", recentItems.length, "| 명세서 포함:", payslipInBackend.length);
        }
        setNotifications(recentItems);
        const unreadCount = recentItems.filter((n) => !n.isRead).length;
        setStaffUnread(unreadCount);
        triggerNotificationRefetch();
        setUseBackendList(true);
        setLoading(false);
        return;
      }
      setUseBackendList(false);
      if (__DEV__) console.log("[알림] 사용 경로: synthetic (salary/history + 기타)");
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

      const [modList, salaryRes, attRes, scheduleRes, backendNotifs] = await Promise.all([
        storeId != null
          ? fetchModifications({ storeId: Number(storeId), requesterId: uid, status: "APPROVED" }, headers).catch(() => [])
          : Promise.resolve([]),
        api.get("/api/v1/salary/history", { params: { userId: uid }, headers }).catch(() => ({ data: [] })),
        api.get("/api/v1/attendances/monthly", {
          params: { userId: uid, year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
          headers,
        }).catch(() => ({ data: {} })),
        api.get("/api/v1/schedules/my-weekly", { params: { username }, headers }).catch(() => ({ data: {} })),
        fetchNotifications(headers).catch(() => []),
      ]);

      // 백엔드가 명세서 발송 시 Notification 생성하면 병합 (salary/history payslipSentAt 없을 때 대비)
      const backendNotifList = Array.isArray(backendNotifs) ? backendNotifs : [];
      if (__DEV__) console.log("[알림] GET /notifications (synthetic 병합용):", backendNotifList.length, "건");
      for (const bn of backendNotifList) {
        if (isBackendPayslipDuplicate(bn)) continue; // "임금명세서 발송 완료" → salary/history 기반으로 통합
        const msg = (bn.message ?? bn.title ?? "").toString();
        const isPayslip = /명세서|payslip/i.test(msg) || (bn.type ?? "").toUpperCase() === "PAYSLIP";
        if (isPayslip) {
          if (__DEV__) console.log("[알림] backend에서 명세서 알림 병합:", bn.id, msg);
          const sortAt = bn.createdAt ?? new Date().toISOString();
          items.push({
            id: idGen++,
            icon: "📧",
            name: "임금 명세서",
            message: msg || "사장님이 임금 명세서를 발송했습니다. 이메일을 확인해 주세요.",
            time: formatRelativeTime(sortAt),
            category: getCategory(sortAt),
            isRead: !!bn.isRead,
            sortAt,
            readKey: `backend-payslip-${bn.id}`,
          });
        }
      }

      for (const m of modList) {
        const timeSource = m.updatedAt ?? m.createdAt;
        const sortAt = timeSource || new Date().toISOString();
        const readKey = `mod-${m.requestId ?? m.request_id ?? idGen}`;
        items.push({
          id: idGen++,
          icon: "✅",
          name: "정정 승인",
          message: "요청하신 스케줄 정정 건이 승인되었습니다.",
          time: formatRelativeTime(timeSource ?? sortAt),
          category: getCategory(timeSource ?? sortAt),
          isRead: false,
          sortAt,
          readKey,
        });
      }

      const salaryList = Array.isArray(salaryRes.data) ? salaryRes.data : salaryRes.data?.data ?? salaryRes.data?.list ?? [];
      if (__DEV__) {
        console.log("[알림] GET /salary/history 응답:", JSON.stringify(salaryRes.data, null, 2));
        console.log("[알림] salaryList 개수:", salaryList.length, "| 추출된 목록:", salaryList.map((s: any) => ({
          month: s.month,
          status: s.status,
          payslipSentAt: s.payslipSentAt ?? s.payslip_sent_at ?? "(없음)",
        })));
      }
      for (const s of salaryList) {
        const status = String(s?.status ?? "").toUpperCase();
        const year = s.year ?? new Date().getFullYear();
        const month = parseSalaryMonth(s);
        const completedAt = s.completedAt ?? s.completed_at ?? s.updatedAt ?? s.updated_at ?? s.createdAt ?? s.created_at ?? s.sentAt ?? s.sent_at ?? s.paidAt ?? s.paid_at ?? s.processedAt ?? s.processed_at;
        const completedAtStr = typeof completedAt === "string"
          ? completedAt
          : typeof completedAt === "number"
            ? new Date(completedAt).toISOString()
            : "";
        const sortAt1 = completedAtStr || `${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`;

        // 급여 입금: COMPLETED일 때만
        if (status === "COMPLETED") {
          const amount = s.amount ?? s.totalAmount ?? 0;
          const amountStr = typeof amount === "number" ? `${amount.toLocaleString()}원` : String(amount);
          const stableTime = completedAtStr ? completedAtStr.replace(/\.\d{3}Z?$/i, "").slice(0, 19) : "";
          const salaryReadKey = `salary-${year}-${month}${stableTime ? `-${stableTime}` : ""}`;
          const timeLabel = completedAtStr ? formatRelativeTime(completedAtStr) : "방금 전";
          items.push({
            id: idGen++,
            icon: "💰",
            name: "급여 입금",
            message: `${month}월 급여 ${amountStr}이 입금되었습니다.`,
            time: timeLabel,
            category: getCategory(completedAtStr || sortAt1),
            isRead: false,
            sortAt: sortAt1,
            readKey: salaryReadKey,
          });
        }

        // 임금 명세서: payslipSentAt(KST ISO 8601) 있을 때만 추가 — 백엔드가 발송 시 저장·반환
        const payslipSentAt = s.payslipSentAt ?? s.payslip_sent_at ?? s.payslipSentDate ?? s.payslip_sent_date ?? s.sentAt ?? s.sent_at ?? (s.payslipSent ? completedAt : null);
        const payslipTimeStr = typeof payslipSentAt === "string" ? payslipSentAt : typeof payslipSentAt === "number" ? new Date(payslipSentAt).toISOString() : "";
        if (payslipTimeStr) {
          const payslipSortAt = payslipTimeStr;
          const payslipStableTime = payslipTimeStr.replace(/\.\d{3}Z?$/i, "").slice(0, 19);
          const payslipReadKey = `payslip-${year}-${month}-${payslipStableTime}`;
          const payslipTimeLabel = formatRelativeTime(payslipTimeStr);
          if (__DEV__) console.log("[알림] 임금 명세서 추가:", `${month}월`, "payslipSentAt:", payslipSentAt ?? "(fallback)");
          items.push({
            id: idGen++,
            icon: "📧",
            name: "임금 명세서",
            message: `사장님이 ${month}월 임금 명세서를 발송했습니다. 이메일을 확인해 주세요.`,
            time: payslipTimeLabel,
            category: getCategory(payslipSortAt),
            isRead: false,
            sortAt: payslipSortAt,
            readKey: payslipReadKey,
          });
        } else if (__DEV__) {
          console.log("[알림] 임금 명세서 스킵:", `${month}월`, "payslipTimeStr:", payslipTimeStr, "status:", status);
        }
      }

      // GET /api/v1/attendances/monthly: 본인 userId로 호출. 백엔드가 다른 유저 데이터를 섞어 보낼 수 있으므로 본인 것만 필터
      const attPayload = attRes.data?.data ?? attRes.data;
      const attListRaw = Array.isArray(attPayload) ? attPayload : attPayload?.list ?? attPayload?.data ?? [];
      const attList = attListRaw.filter(
        (a: any) => (a.userId ?? a.user_id) == null || Number(a.userId ?? a.user_id) === uid,
      );
      const attCutoff = Date.now() - NOTIFICATION_MAX_AGE_MS;
      const seenAttKeys = new Set<string>();
      for (const a of attList) {
        const startTime = a.startTime ?? a.checkInTime;
        const endTime = a.endTime ?? a.checkOutTime;
        const totalHours = a.totalHours;
        const startSort = getSortTimestamp(startTime);
        const endSort = getSortTimestamp(endTime);
        if (startTime && startSort >= attCutoff) {
          const readKeyIn = `att-in-${uid}-${startTime}`;
          if (!seenAttKeys.has(readKeyIn)) {
            seenAttKeys.add(readKeyIn);
            const timePart = formatTimeForDisplay(startTime);
            const isLate = String(a?.status ?? "").toUpperCase() === "LATE";
            items.push({
              id: idGen++,
              icon: "⏰",
              name: "출근",
              message: formatStaffAttendanceMessage("in", timePart, { isLate }),
              time: formatRelativeTime(startTime),
              category: getCategory(startTime),
              isRead: false,
              sortAt: startTime || new Date().toISOString(),
              readKey: readKeyIn,
            });
          }
        }
        if (endTime && endSort >= attCutoff) {
          const readKeyOut = `att-out-${uid}-${endTime}`;
          if (!seenAttKeys.has(readKeyOut)) {
            seenAttKeys.add(readKeyOut);
            const timePart = formatTimeForDisplay(endTime);
            items.push({
              id: idGen++,
              icon: "🏠",
              name: "퇴근",
              message: formatStaffAttendanceMessage("out", timePart, { totalHours: totalHours ?? undefined }),
              time: formatRelativeTime(endTime),
              category: getCategory(endTime),
              isRead: false,
              sortAt: endTime || new Date().toISOString(),
              readKey: readKeyOut,
            });
          }
        }
      }

      const schedPayload = scheduleRes.data?.data ?? scheduleRes.data;
      const schedList = Array.isArray(schedPayload) ? schedPayload : schedPayload?.list ?? schedPayload?.items ?? [];
      const storeName = (me?.storeName ?? me?.store_name ?? "") || "";
      schedList.forEach((s: Record<string, unknown>) => {
        const workDate = (s?.workDate ?? s?.date) as string | undefined;
        const createdAt = (s?.createdAt ?? s?.created_at ?? s?.registeredAt) as string | undefined;
        const timeSource = createdAt ?? (workDate ? `${workDate}T12:00:00` : null);
        const sortAt = timeSource ?? new Date().toISOString();
        const schedId = s?.scheduleId ?? s?.id ?? s?.schedule_id;
        const stableTime = (createdAt || sortAt || "").toString().replace(/\.\d{3}Z?$/i, "").slice(0, 19);
        const readKeyId = schedId != null ? String(schedId) : (stableTime || workDate || "na");
        const dateLabel = workDate || "";
        const message = dateLabel
          ? (storeName ? `[${storeName}] ` : "") + `${dateLabel} 근무 스케줄이 등록되었습니다.`
          : "새로운 근무 스케줄이 등록되었습니다.";
        items.push({
          id: idGen++,
          icon: "📅",
          name: "스케줄 배정",
          message,
          time: formatRelativeTime(sortAt),
          category: getCategory(sortAt),
          isRead: false,
          sortAt,
          readKey: `sched-${workDate ?? ""}-${readKeyId}`,
        });
      });

      // 최신 알림이 상단에 오도록 정렬
      items.sort((a, b) => getSortTimestamp(b.sortAt) - getSortTimestamp(a.sortAt));
      const recentItems = filterRecentOnly(items);
      if (__DEV__) {
        const payslipCount = recentItems.filter((n) => n.name === "임금 명세서").length;
        console.log("[알림] 최종 items:", items.length, "| filterRecentOnly 후:", recentItems.length, "| 임금 명세서 개수:", payslipCount);
        if (payslipCount === 0 && salaryList.length > 0) console.warn("[알림] salaryList 있으나 임금 명세서 0건 → payslipSentAt 또는 filterRecentOnly(90일) 확인");
      }
      try {
        const raw = await AsyncStorage.getItem(getStaffReadKeysKey(username));
        let readKeys: string[] = raw ? JSON.parse(raw) : [];
        if (readKeys.length === 0) {
          const legacyRaw = await AsyncStorage.getItem(STAFF_READ_KEYS_LEGACY);
          if (legacyRaw) {
            readKeys = JSON.parse(legacyRaw);
            await AsyncStorage.setItem(getStaffReadKeysKey(username), JSON.stringify(readKeys));
          }
        }
        const readSet = new Set(readKeys);
        recentItems.forEach((n) => {
          if (n.readKey && readSet.has(n.readKey)) n.isRead = true;
        });
      } catch (_) {}
      setNotifications(recentItems);
      const unreadCount = recentItems.filter((n) => !n.isRead).length;
      setStaffUnread(unreadCount);
      triggerNotificationRefetch();
    } catch (e) {
      console.error("알림 목록 조회 실패:", e);
      setNotifications([]);
      setStaffUnread(0);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, setStaffUnread, triggerNotificationRefetch]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = (id: number) => {
    const item = notifications.find((n) => n.id === id);
    if (!item) return;
    if (!item.isRead) setStaffUnread((prev) => Math.max(0, (prev ?? 0) - 1));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    // 백엔드 알림(backend-xxx)만 API 호출. synthetic(임금명세서 등)은 AsyncStorage만 사용
    if (useBackendList && item.readKey?.startsWith("backend-")) {
      getAuthHeader().then((headers) => markNotificationRead(id, headers).then(() => triggerNotificationRefetch()));
    }
    // 항상 AsyncStorage에 읽음 저장 → 로그인 새로 해도 같은 사용자 읽음 유지
    if (item.readKey) {
      (async () => {
        try {
          const username = await AsyncStorage.getItem("username") ?? "";
          const key = getStaffReadKeysKey(username);
          const raw = await AsyncStorage.getItem(key);
          const readKeys: string[] = raw ? JSON.parse(raw) : [];
          if (!readKeys.includes(item.readKey!)) {
            readKeys.push(item.readKey!);
            await AsyncStorage.setItem(key, JSON.stringify(readKeys));
          }
        } catch (_) {}
      })();
    }
  };

  const handleMarkAllRead = async () => {
    const readKeys = notifications.map((n) => n.readKey).filter(Boolean) as string[];
    setStaffUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      const headers = await getAuthHeader();
      await markAllNotificationsRead(headers);
      triggerNotificationRefetch();
    } catch (_) {}
    try {
      const username = await AsyncStorage.getItem("username") ?? "";
      const key = getStaffReadKeysKey(username);
      const raw = await AsyncStorage.getItem(key);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      const set = new Set([...existing, ...readKeys]);
      await AsyncStorage.setItem(key, JSON.stringify([...set]));
    } catch (_) {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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
          onPress={handleBack}
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
        {notifications.length > 0 ? (
          <View style={styles.section}>
            {notifications.map((n) => (
              <NotificationItem key={n.id} data={n} onPress={() => handleNotificationPress(n.id)} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>새로운 알림이 없습니다</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
