/**
 * 알림 API
 * - PATCH /api/v1/users/fcm-token: FCM 토큰 저장 (로그인 직후 호출)
 * - GET /api/v1/notifications: 알림 목록 조회
 * - PATCH /api/v1/notifications/read-all: 전체 읽음
 * - PATCH /api/v1/notifications/{id}/read: 개별 읽음
 */
import api from "../constants/api";

/**
 * FCM/푸시 토큰 획득. 현재는 미구현 시 "" 반환.
 * 푸시 연동 시 expo-notifications getExpoPushTokenAsync() 또는 Firebase FCM 토큰으로 교체.
 */
export async function getFcmTokenOrEmpty(): Promise<string> {
  try {
    // TODO: const token = await Notifications.getExpoPushTokenAsync(); return token.data;
    return "";
  } catch {
    return "";
  }
}

/** FCM 토큰 저장 — 로그인 직후 호출. 푸시 알림 수신을 위해 필수. 토큰이 있을 때만 호출 권장. */
export async function updateFcmToken(
  fcmToken: string,
  headers?: Record<string, string>
): Promise<{ ok: boolean; message?: string }> {
  if (!fcmToken?.trim()) return { ok: false };
  try {
    const res = await api.patch<{ status?: string; message?: string }>(
      "/api/v1/users/fcm-token",
      { token: fcmToken },
      { headers }
    );
    const ok = res?.data?.status === "success";
    return { ok, message: res?.data?.message };
  } catch (e: any) {
    if (__DEV__) console.warn("[notificationApi] updateFcmToken 실패", e?.response?.data ?? e);
    return { ok: false };
  }
}

export interface BackendNotificationItem {
  id: number;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
}

/** 알림 목록 조회 — 최신순. Bearer 토큰만 필요. */
export async function fetchNotifications(
  headers?: Record<string, string>
): Promise<BackendNotificationItem[]> {
  try {
    const res = await api.get<{ status?: string; data?: BackendNotificationItem[] }>(
      "/api/v1/notifications",
      { headers }
    );
    const list = res?.data?.data ?? res?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (e: any) {
    if (__DEV__) console.warn("[notificationApi] fetchNotifications 실패", e?.response?.data ?? e);
    return [];
  }
}

/** 전체 읽음 — "모두 읽음" 버튼 시 호출. Bearer 토큰만 필요. */
export async function markAllNotificationsRead(
  headers?: Record<string, string>
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await api.patch<{ status?: string; message?: string }>(
      "/api/v1/notifications/read-all",
      {},
      { headers }
    );
    const ok = res?.data?.status === "success";
    return { ok, message: res?.data?.message };
  } catch (e: any) {
    if (__DEV__) console.warn("[notificationApi] markAllRead 실패", e?.response?.data ?? e);
    return { ok: false };
  }
}

/** 개별 읽음 — 알림 클릭 시 호출. id는 백엔드 Notification 엔티티 id. */
export async function markNotificationRead(
  id: number,
  headers?: Record<string, string>
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await api.patch<{ status?: string; message?: string }>(
      `/api/v1/notifications/${id}/read`,
      {},
      { headers }
    );
    const ok = res?.data?.status === "success";
    return { ok, message: res?.data?.message };
  } catch (e: any) {
    if (__DEV__) console.warn("[notificationApi] markRead 실패", id, e?.response?.data ?? e);
    return { ok: false };
  }
}
