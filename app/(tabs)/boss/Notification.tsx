import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { useSetUnreadNotification, useTriggerNotificationRefetch } from "../../../contexts/UnreadNotificationContext";
import {
  fetchModifications,
  updateModificationStatus,
  type ModificationRequestItem,
} from "../../../services/modificationApi";
import { markAllNotificationsRead } from "../../../services/notificationApi";
import { styles } from "../../../styles/tabs/boss/Notification";
import { formatAttendanceMessage, formatAttendanceMessageNoTime } from "../../../utils/notificationMessage";
import { formatRelativeTime, getCategory, getSortTimestamp, parseDateForRelative } from "../../../utils/relativeTime";

const BOSS_READ_KEYS_KEY = "boss_read_notification_keys";

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

/** 정정 요청 API 항목 → BossNotificationItemData (수정/삭제 구분). beforeValue는 API 또는 scheduleMap에서 채움 */
function mapToModificationItem(
  item: ModificationRequestItem,
  scheduleTimeByTargetId?: Map<number, string>
): BossNotificationItemData {
  const name = item.requesterName || "알바생";
  const isDelete = item.requestType === "DELETE";
  const typeLabel = item.targetType === "ATTENDANCE" ? "근무 시간" : "스케줄";
  const afterValue = (item.afterValue ?? (item as any).after_value ?? "").trim();
  let beforeValue = (
    (item as any).beforeValue ??
    (item as any).before_value ??
    (item as any).originalValue ??
    (item as any).original_value ??
    (item as any).previousValue ??
    (item as any).previous_value ??
    (item as any).beforeTime ??
    (item as any).before_time ??
    (typeof (item as any).schedule === "object" && (item as any).schedule != null
      ? ((item as any).schedule?.time ?? ((item as any).schedule?.startTime != null && (item as any).schedule?.endTime != null ? `${(item as any).schedule.startTime}~${(item as any).schedule.endTime}` : ""))
      : "") ??
    (typeof (item as any).target === "object" && (item as any).target != null
      ? ((item as any).target?.time ?? ((item as any).target?.startTime != null && (item as any).target?.endTime != null ? `${(item as any).target.startTime}~${(item as any).target.endTime}` : ""))
      : "") ??
    ""
  ).trim();
  if (!beforeValue && scheduleTimeByTargetId != null) {
    const tid = item.targetId ?? (item as any).target_id ?? (item as any).scheduleId ?? (item as any).schedule_id;
    if (tid != null) beforeValue = (scheduleTimeByTargetId.get(Number(tid)) ?? "").trim();
  }
  const reason = (item.reason ?? (item as any).reason ?? "").trim();
  const targetDate = item.targetDate ?? (item as any).target_date ?? "";
  const before = beforeValue || "-";
  const reqRecord = isDelete ? "기록 삭제" : (afterValue || "-");
  const dateLine = targetDate ? `근무 날짜: ${targetDate}` : "";
  const lines = [
    isDelete ? `${name}님 삭제 요청이 들어왔습니다.` : `${name}님 수정 요청이 들어왔습니다.`,
    ...(dateLine ? [dateLine] : []),
    `${before} → ${reqRecord}`,
    `사유: ${reason || "-"}`,
  ];
  const message = lines.join("\n");
  // 수정 요청 API: createdAt/updatedAt을 camel·snake 둘 다 읽기 (백엔드가 KST +09:00 문자열로 내려줌)
  const rawCreated = (item.createdAt ?? (item as any).created_at) as string | undefined;
  const rawUpdated = (item.updatedAt ?? (item as any).updated_at) as string | undefined;
  const timeSource = (item.status === "APPROVED" || item.status === "REJECTED") && rawUpdated
    ? rawUpdated
    : rawCreated;
  // 날짜만/자정이면 UTC 자정으로 해석돼 "9시간 전" 나옴 → 현재 시각 사용
  const sortAtRaw = timeSource?.trim() || new Date().toISOString();
  const sortAt = sortAtRaw && isMidnightOrDateOnly(sortAtRaw) ? new Date().toISOString() : sortAtRaw;
  return {
    id: item.requestId,
    icon: "⏰",
    name: isDelete ? "삭제 요청" : "수정 요청",
    message,
    time: formatRelativeTime(sortAt),
    category: getCategory(sortAt),
    isRead: false,
    hasActions: true,
    sortAt,
    readKey: `mod-${item.requestId}`,
    beforeValue: beforeValue || undefined,
    afterValue: afterValue || undefined,
    targetDate: targetDate || undefined,
    typeLabel: typeLabel || undefined,
  };
}

/** 정산 알림 전용: 타임존 없을 때 UTC로 해석해 "9시간 전" 오표기 방지. (백엔드가 UTC로 보내고 Z 누락 시 사용) */
function normalizeSalarySortAt(raw: string): string {
  const s = String(raw).trim();
  if (!s) return s;
  if (/[Zz]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return `${s.replace(/\.\d{3}$/, "").replace(/Z$/i, "")}Z`;
  return s;
}

/** 날짜만 또는 자정(오프셋 없음/Z)이면 '정확한 요청 시각'이 아님 → 현재 시각으로 표시해 "9시간 전" 방지 */
function isMidnightOrDateOnly(s: string): boolean {
  const t = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return true;
  if (/T00:00:00(\.000)?([Zz])?$/.test(t) || /T00:00(\.000)?([Zz])?$/.test(t)) return true;
  return false;
}

/** 급여 정산 요청(REQUESTED) → BossNotificationItemData. GET /api/v1/salary/monthly 의 requestedAt(= 요청 보낸 시각, KST ISO) → "N분 전" 표시 */
function mapSalaryRequestToItem(worker: { userId: number; name?: string; requestedAt?: string | null }): BossNotificationItemData {
  const w = worker as Record<string, unknown>;
  const workerName = (worker.name as string) || "알바생";
  // requestedAt / requested_at 이 정식 필드. 없을 때만 다른 필드 fallback
  const rawSortAt =
    (w.requestedAt as string) ??
    (w.requested_at as string) ??
    (w.createdAt as string) ??
    (w.created_at as string) ??
    (w.requestDate as string) ??
    (w.updatedAt as string) ??
    (w.updated_at as string) ??
    (w.date as string);
  let sortAtRaw =
    rawSortAt && String(rawSortAt).trim()
      ? String(rawSortAt).trim()
      : new Date().toISOString();
  // 날짜만/자정이면 UTC 자정으로 해석돼 "9시간 전" 나옴 → 현재 시각 사용
  if (sortAtRaw && isMidnightOrDateOnly(sortAtRaw)) sortAtRaw = new Date().toISOString();
  const sortAt = sortAtRaw ? normalizeSalarySortAt(sortAtRaw) : sortAtRaw;
  // readKey는 새로고침 후에도 읽음 유지되도록 타임스탬프 제외 (salary-req-{userId}만 사용)
  return {
    id: 1000000 + worker.userId,
    icon: "💰",
    name: "정산",
    message: `${workerName}님이 급여 정산을 요청했습니다. 급여 페이지에서 확인하세요.`,
    time: formatRelativeTime(sortAt),
    category: getCategory(sortAt),
    isRead: false,
    hasActions: false,
    sortAt,
    readKey: `salary-req-${worker.userId}`,
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
    const uid = Number(a.userId);
    if (startTime) {
      const timePart = formatTimeForDisplay(startTime);
      const isLate = status === "LATE";
      items.push({
        id: idBase++,
        icon: isLate ? "⚠️" : "⏰",
        name: isLate ? "지각" : "출근",
        message: formatAttendanceMessage("in", timePart, { isLate, namePrefix: `${name}님이 ` }),
        time: formatRelativeTime(startTime),
        category: getCategory(startTime),
        isRead: false,
        hasActions: false,
        sortAt: startTime || new Date().toISOString(),
        readKey: `att-in-${uid}-${startTime}`,
      });
    } else if (hasClockedIn) {
      const fallbackSortAt = new Date().toISOString();
      items.push({
        id: idBase++,
        icon: status === "LATE" ? "⚠️" : "⏰",
        name: status === "LATE" ? "지각" : "출근",
        message: formatAttendanceMessageNoTime("in", { isLate: status === "LATE", namePrefix: `${name}님이 ` }),
        time: formatRelativeTime(fallbackSortAt),
        category: "오늘",
        isRead: false,
        hasActions: false,
        sortAt: fallbackSortAt,
        readKey: `att-in-${uid}-${fallbackSortAt}`,
      });
    }
    if (endTime) {
      const endTimePart = formatTimeForDisplay(endTime);
      items.push({
        id: idBase++,
        icon: "🏠",
        name: "퇴근",
        message: formatAttendanceMessage("out", endTimePart, {
          totalHours: totalHours ?? undefined,
          namePrefix: `${name}님이 `,
        }),
        time: formatRelativeTime(endTime),
        category: getCategory(endTime),
        isRead: false,
        hasActions: false,
        sortAt: endTime || new Date().toISOString(),
        readKey: `att-out-${uid}-${endTime}`,
      });
    } else if (hasClockedOut && !startTime) {
      const fallbackSortAt = new Date().toISOString();
      items.push({
        id: idBase++,
        icon: "🏠",
        name: "퇴근",
        message: formatAttendanceMessageNoTime("out", { namePrefix: `${name}님이 ` }),
        time: formatRelativeTime(fallbackSortAt),
        category: "오늘",
        isRead: false,
        hasActions: false,
        sortAt: fallbackSortAt,
        readKey: `att-out-${uid}-${fallbackSortAt}`,
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

/** "2025-02-23", "2025/02/23", "2025-02-23T00:00:00" 등 → "YYYY-MM-DD" */
function normalizeToYYYYMMDD(s: string): string {
  const trimmed = String(s).trim();
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 알림에 보일 스케줄 기간: 등록 시각 기준 최근 90일 (이번주/다음주/이전주 무관) */
const SCHEDULE_NOTIFICATION_AGE_MS = 90 * 24 * 60 * 60 * 1000;

/** 주간 스케줄 → "OO님이 근무를 등록했습니다" 알림 (id: 5xxxxxx). 이번주/다음주/이전주 무관하게 등록 시각(registeredAt) 기준 "N분 전" 표시 */
function mapSchedulesToItems(
  list: Array<Record<string, unknown> & { scheduleId?: number; workDate?: string; date?: string; day?: string; weekStart?: string; startDate?: string; time?: string; startTime?: string; endTime?: string; createdAt?: string; created_at?: string; registeredAt?: string; updatedAt?: string; workers?: Array<{ name?: string; registeredAt?: string; created_at?: string }> }>,
  startDate: string
): BossNotificationItemData[] {
  const items: BossNotificationItemData[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const cutoff = new Date(now.getTime() - SCHEDULE_NOTIFICATION_AGE_MS);
  let idBase = 5000000;
  const seen = new Set<string>();
  for (const s of list) {
    // 백엔드가 work_date, date, targetDate 등 다른 키로 내려줄 수 있음. workers[0]에만 있는 경우도 있음
    let workDate =
      (s.workDate ?? s.date ?? (s as any).work_date ?? (s as any).targetDate ?? (s as any).target_date ?? (s as any).scheduleDate ?? (s as any).schedule_date) as string | undefined;
    if (!workDate && s.workers?.[0]) {
      const w = (s.workers[0] as any);
      workDate = (w.workDate ?? w.work_date ?? w.date ?? w.targetDate) as string | undefined;
    }
    if (workDate && typeof workDate === "string") {
      workDate = normalizeToYYYYMMDD(workDate);
    }
    if (!workDate && s.day) {
      const dayIndex = DAY_ORDER.indexOf(String(s.day).toUpperCase());
      if (dayIndex >= 0) {
        // 해당 슬롯이 속한 주의 일요일 사용 (23일 등록이 2일로 잡히는 버그 방지)
        const slotWeekStart = (s as any).weekStart ?? (s as any).startDate ?? startDate;
        const start = new Date(slotWeekStart);
        start.setDate(start.getDate() + dayIndex);
        workDate = start.toISOString().split("T")[0];
      }
    }
    // 등록 시각: 백엔드가 "알바생이 등록한 시간"으로 registeredAt(KST ISO) 내려줌 → 항상 이걸로 "N분 전" 표시
    const slotRegistered = (s.registeredAt ?? (s as any).registered_at ?? s.createdAt ?? s.created_at ?? s.updatedAt) as string | undefined;
    const workerRegistered = (s.workers && s.workers[0])
      ? ((s.workers[0] as any).registeredAt ?? (s.workers[0] as any).registered_at ?? (s.workers[0] as any).createdAt ?? (s.workers[0] as any).created_at)
      : undefined;
    const createdAt = (slotRegistered ?? workerRegistered) as string | undefined;
    const timeStr = s.time ?? (s.startTime && s.endTime ? `${s.startTime}~${s.endTime}` : "");
    const workerName = (s.workers && s.workers[0]?.name) ? s.workers[0].name : "알바생";
    const dateLabel = workDate ? `${String(workDate).slice(5, 7)}월 ${String(workDate).slice(8, 10)}일` : "";
    const msg = timeStr
      ? `${workerName}님이 ${dateLabel} 근무를 등록했습니다. (${timeStr})`
      : `${workerName}님이 ${dateLabel} 근무를 등록했습니다.`;
    const stableSchedId = s.scheduleId ?? s.id ?? (s as any).schedule_id;
    const stableTime = (createdAt || "").toString().replace(/\.\d{3}Z?$/i, "").slice(0, 19);
    const readKeyId = stableSchedId != null ? String(stableSchedId) : `${workDate ?? ""}-${workerName}-${(stableTime || workDate) ?? ""}`;
    const key = `${workDate}-${readKeyId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const readKeyBase = `sched-${workDate ?? ""}-${readKeyId}`;
    // 이번주/다음주/이전주 무관하게 항상 "등록한 시간" 기준으로만 표시 (등록 시각이 있으면 그대로, 없거나 날짜만/자정이면 현재 시각 → "방금 전")
    const nowIso = new Date().toISOString();
    const sortAtForDisplay =
      createdAt && !isMidnightOrDateOnly(createdAt)
        ? createdAt
        : nowIso;
    if (createdAt) {
      const parsed = parseDateForRelative(createdAt);
      if (parsed && parsed >= cutoff) {
        items.push({
          id: idBase++,
          icon: "📅",
          name: "스케줄",
          message: msg,
          time: formatRelativeTime(sortAtForDisplay),
          category: getCategory(sortAtForDisplay),
          isRead: false,
          hasActions: false,
          sortAt: sortAtForDisplay,
          readKey: readKeyBase,
        });
        continue;
      }
    }
    // 등록 시각 없음: 근무일이 오늘/미래일 때만 표시. 등록 시각을 모르므로 항상 현재 시각으로 "방금 전"
    if (workDate && workDate >= todayStr) {
      items.push({
        id: idBase++,
        icon: "📅",
        name: "스케줄",
        message: msg,
        time: formatRelativeTime(nowIso),
        category: getCategory(nowIso),
        isRead: false,
        hasActions: false,
        sortAt: nowIso,
        readKey: readKeyBase,
      });
    }
  }
  return items;
}

export default function BossNotificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [notifications, setNotifications] = useState<BossNotificationItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setStoreId] = useState<number | null>(null);
  const setBossUnread = useSetUnreadNotification("boss");
  const triggerNotificationRefetch = useTriggerNotificationRefetch();

  const handleBack = () => {
    try {
      const returnTo = typeof params.returnTo === "string" ? decodeURIComponent(params.returnTo) : "";
      if (returnTo && returnTo.includes("/boss/") && !returnTo.includes("/Notification")) {
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
        api.get("/api/v1/schedules/weekly", { params: { storeId: id, startDate: weekStart, weeks: 52 }, headers }).catch(() => ({ data: [] })),
      ]);
      const dataRoot = salaryRes.data?.data ?? salaryRes.data;
      const workers = dataRoot?.payments ?? dataRoot?.workers ?? [];
      const requestedWorkers = workers.filter(
        (w: { status?: string }) => String(w?.status ?? "").toUpperCase() === "REQUESTED"
      );
      const salaryItems = requestedWorkers.map((w: { userId: number; name?: string }) =>
        mapSalaryRequestToItem(w)
      );
      const attPayload = attendancesRes.data?.data ?? attendancesRes.data;
      const attList = Array.isArray(attPayload)
        ? attPayload
        : (attPayload?.list ?? attPayload?.attendances ?? attPayload?.items ?? []);
      const attendanceItems = mapAttendancesToItems(Array.isArray(attList) ? attList : []);

      const schedPayload = schedulesRes.data?.data ?? schedulesRes.data;
      const schedListBase = Array.isArray(schedPayload)
        ? schedPayload
        : (schedPayload?.list ?? schedPayload?.items ?? schedPayload?.weeks ?? []);

      const getWeekStartForDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return weekStart;
        const sun = new Date(d);
        sun.setDate(d.getDate() - d.getDay());
        return sun.toISOString().split("T")[0];
      };
      const weekStartsNeeded = new Set<string>([weekStart]);
      for (const m of modList as any[]) {
        if (m?.targetType === "SCHEDULE" || m?.target_type === "SCHEDULE") {
          const td = m?.targetDate ?? m?.target_date ?? "";
          if (td) weekStartsNeeded.add(getWeekStartForDate(td));
        }
      }
      let schedListForMap = schedListBase;
      const extraWeeks = [...weekStartsNeeded].filter((ws) => ws !== weekStart);
      if (extraWeeks.length > 0) {
        const extraRes = await Promise.all(
          extraWeeks.map((startDate) =>
            api.get("/api/v1/schedules/weekly", { params: { storeId: id, startDate }, headers }).catch(() => ({ data: [] }))
          )
        );
        for (const res of extraRes) {
          const payload = res?.data?.data ?? res?.data;
          const list = Array.isArray(payload) ? payload : payload?.list ?? payload?.items ?? [];
          schedListForMap = schedListForMap.concat(list);
        }
      }

      // API가 주차별로 묶어서 내려주면(weekStart + schedules) 펼치고, 각 슬롯에 해당 주의 weekStart 부여 → 13일 등록이 6일로 나오는 버그 방지
      const flattenedSchedules: Array<Record<string, unknown> & { weekStart?: string; startDate?: string }> = [];
      for (const x of schedListForMap as any[]) {
        if (Array.isArray(x?.schedules)) {
          const ws = x.weekStart ?? x.startDate ?? weekStart;
          for (const slot of x.schedules) {
            flattenedSchedules.push({ ...slot, weekStart: slot.weekStart ?? slot.startDate ?? ws });
          }
        } else if (Array.isArray(x?.items)) {
          const ws = x.weekStart ?? x.startDate ?? weekStart;
          for (const slot of x.items) {
            flattenedSchedules.push({ ...slot, weekStart: slot.weekStart ?? slot.startDate ?? ws });
          }
        } else {
          flattenedSchedules.push({ ...x, weekStart: x.weekStart ?? x.startDate ?? weekStart });
        }
      }
      const scheduleItems = mapSchedulesToItems(flattenedSchedules as Parameters<typeof mapSchedulesToItems>[0], weekStart);

      const scheduleTimeByTargetId = new Map<number, string>();
      const flatSched = (schedListForMap as any[]).flatMap((x: any) =>
        Array.isArray(x?.schedules) ? x.schedules : Array.isArray(x?.items) ? x.items : [x]
      );
      for (const s of flatSched) {
        const slotTime =
          s?.time ??
          (s?.startTime != null && s?.endTime != null ? `${s.startTime}~${s.endTime}` : null) ??
          "";
        const tSlot = typeof slotTime === "string" ? slotTime.trim() : "";
        const workers = Array.isArray(s?.workers) ? s.workers : [];
        if (workers.length > 0) {
          for (const w of workers) {
            const sid = w?.scheduleId ?? w?.schedule_id ?? w?.id;
            const wTime =
              w?.time ??
              (w?.startTime != null && w?.endTime != null ? `${w.startTime}~${w.endTime}` : null) ??
              "";
            const t = (typeof wTime === "string" ? wTime.trim() : "") || tSlot;
            if (sid != null && t) scheduleTimeByTargetId.set(Number(sid), t);
          }
          if (tSlot && (s?.scheduleId ?? s?.id ?? s?.schedule_id) != null) {
            const sid = s?.scheduleId ?? s?.id ?? s?.schedule_id;
            scheduleTimeByTargetId.set(Number(sid), tSlot);
          }
        } else {
          const sid = s?.scheduleId ?? s?.id ?? s?.schedule_id;
          if (sid != null && tSlot) scheduleTimeByTargetId.set(Number(sid), tSlot);
        }
      }
      const modificationItems = modList.map((m) => mapToModificationItem(m, scheduleTimeByTargetId));

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
        const paydaySortAt = new Date().toISOString();
        paydayItems.push({
          id: 4000000,
          icon: "📅",
          name: "안내",
          message: msg,
          time: formatRelativeTime(paydaySortAt),
          category: "오늘",
          isRead: false,
          hasActions: false,
          sortAt: paydaySortAt,
          readKey: "payday-4000000",
        });
      }
      const combined = [...modificationItems, ...salaryItems, ...attendanceItems, ...scheduleItems, ...paydayItems];
      // 최신 알림이 상단에 오도록 정렬
      combined.sort((a, b) => getSortTimestamp(b.sortAt) - getSortTimestamp(a.sortAt));
      try {
        const raw = await AsyncStorage.getItem(BOSS_READ_KEYS_KEY);
        const readKeys: string[] = raw ? JSON.parse(raw) : [];
        const readSet = new Set(readKeys);
        // 예전 형식 salary-req-123-2025-01-31... 도 새 형식 salary-req-123 과 매칭되도록 추가
        readKeys.forEach((k) => {
          const m = /^salary-req-(\d+)/.exec(k);
          if (m) readSet.add(`salary-req-${m[1]}`);
        });
        combined.forEach((n) => {
          if (n.readKey && readSet.has(n.readKey)) n.isRead = true;
        });
      } catch (_) {}
      setNotifications(combined);
      const unreadCount = combined.filter((n) => !n.isRead).length;
      setBossUnread(unreadCount);
      triggerNotificationRefetch();
    } catch (e) {
      console.error("알림 목록 조회 실패:", e);
      setNotifications([]);
      setBossUnread(0);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, setBossUnread, triggerNotificationRefetch]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = (id: number) => {
    const item = notifications.find((n) => n.id === id);
    const readKey = item?.readKey;
    if (!readKey) return;
    if (!item.isRead) setBossUnread((prev) => Math.max(0, (prev ?? 0) - 1));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BOSS_READ_KEYS_KEY);
        const readKeys: string[] = raw ? JSON.parse(raw) : [];
        if (!readKeys.includes(readKey)) {
          readKeys.push(readKey);
          await AsyncStorage.setItem(BOSS_READ_KEYS_KEY, JSON.stringify(readKeys));
        }
      } catch (_) {}
    })();
  };

  const handleMarkAllRead = async () => {
    const readKeys = notifications.map((n) => n.readKey).filter(Boolean) as string[];
    setBossUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      const headers = await getAuthHeader();
      await markAllNotificationsRead(headers);
      triggerNotificationRefetch();
    } catch (_) {}
    try {
      const raw = await AsyncStorage.getItem(BOSS_READ_KEYS_KEY);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      const set = new Set([...existing, ...readKeys]);
      await AsyncStorage.setItem(BOSS_READ_KEYS_KEY, JSON.stringify([...set]));
    } catch (_) {}
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
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, hasActions: false, requestStatus: "REJECTED" as const } : n))
            );
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
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
      <StatusBar barStyle="dark-content" />
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
              <BossNotificationItem
                key={n.id}
                data={n}
                onPress={() => handleNotificationPress(n.id)}
                onApprove={n.hasActions ? handleApprove : undefined}
                onReject={n.hasActions ? handleReject : undefined}
              />
            ))}
          </View>
        ) : (
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
