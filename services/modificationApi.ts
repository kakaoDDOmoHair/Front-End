/**
 * 정정 요청(Modification Request) API
 * - 모든 페이지에서 알림/정정 요청 메시지 보내기·받기에 사용
 * - 백엔드: /api/v1/modifications/** 는 authenticated() 이므로 JWT 필수
 *
 * ⭐ 토큰은 users/me, my-weekly 와 동일하게 붙음
 * - 이 파일은 constants/api.ts 의 api 인스턴스를 그대로 사용함
 * - api 에 붙은 request interceptor 가 모든 요청(users/me, my-weekly, modifications 포함)에
 *   Authorization: Bearer {token} 을 자동 첨부함 → modifications 도 예외 없이 토큰 포함
 */
import api from "../constants/api";

function mergeHeaders(headers?: Record<string, string>) {
  return headers?.Authorization?.trim() ? headers : undefined;
}

// --- 타입 ---
export type ModificationTargetType = "ATTENDANCE" | "SCHEDULE";
export type ModificationRequestType = "UPDATE" | "DELETE" | "REGISTER";
export type ModificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ModificationRequestItem {
  requestId: number;
  storeId: number;
  targetType: ModificationTargetType;
  targetId: number;
  requestType?: ModificationRequestType;
  afterValue?: string;
  targetDate: string;
  reason?: string;
  status: ModificationStatus;
  requesterId?: number;
  requesterName?: string;
  /** 요청이 등록된 시각 (알바가 요청한 시각) */
  createdAt?: string;
  /** 사장이 수락/거절한 시각 — 있으면 이걸로 표시해 '방금 전'이 맞게 나오게 함 */
  updatedAt?: string;
  [key: string]: unknown;
}

export interface RegisterModificationBody {
  storeId: number;
  targetType: ModificationTargetType;
  targetId: number;
  requestType: ModificationRequestType; // "UPDATE" | "DELETE" | "REGISTER" (ATTENDANCE REGISTER는 백엔드 미지원)
  afterValue: string; // "HH:mm~HH:mm" 형식 (삭제 시 "00:00~00:00" 등)
  targetDate: string; // "YYYY-MM-DD"
  reason: string;
}

export interface UpdateStatusBody {
  status: "APPROVED" | "REJECTED";
}

// --- 1. 정정 요청 등록 (POST /api/v1/modifications) ---
export async function registerModification(
  body: RegisterModificationBody,
  headers?: Record<string, string>
) {
  const { data } = await api.post<{ success: boolean }>(
    "/api/v1/modifications",
    body,
    mergeHeaders(headers) ? { headers: mergeHeaders(headers) } : undefined
  );
  return data;
}

// --- 2. 정정 요청 목록 조회 (GET /api/v1/modifications) ---
export async function fetchModifications(params: {
  storeId: number;
  status?: ModificationStatus;
  requesterId?: number;
}, headers?: Record<string, string>) {
  const res = await api.get(
    "/api/v1/modifications",
    { params, ...(mergeHeaders(headers) ? { headers: mergeHeaders(headers) } : {}) }
  );
  const data = res.data as any;
  if (Array.isArray(data)) return data;
  const inner = data?.data;
  const list =
    data?.list ??
    (Array.isArray(inner) ? inner : undefined) ??
    inner?.list ??
    inner?.data ??
    data?.content ??
    data?.modifications ??
    data?.items ??
    [];
  return Array.isArray(list) ? list : [];
}

// --- 3. 정정 요청 상세 조회 (GET /api/v1/modifications/{requestId}) ---
export async function fetchModificationDetail(
  requestId: number,
  headers?: Record<string, string>
) {
  const { data } = await api.get<ModificationRequestItem>(
    `/api/v1/modifications/${requestId}`,
    mergeHeaders(headers) ? { headers: mergeHeaders(headers) } : undefined
  );
  return data;
}

// --- 4. 요청 승인/거절 (PATCH /api/v1/modifications/{requestId}/status) ---
export async function updateModificationStatus(
  requestId: number,
  body: UpdateStatusBody,
  headers?: Record<string, string>
) {
  const { data } = await api.patch<{ success: boolean }>(
    `/api/v1/modifications/${requestId}/status`,
    body,
    mergeHeaders(headers) ? { headers: mergeHeaders(headers) } : undefined
  );
  return data;
}

// --- 5. 정정 요청 삭제 (DELETE /api/v1/modifications/{requestId}) ---
export async function deleteModification(
  requestId: number,
  headers?: Record<string, string>
) {
  const { data } = await api.delete<{ success: boolean }>(
    `/api/v1/modifications/${requestId}`,
    mergeHeaders(headers) ? { headers: mergeHeaders(headers) } : undefined
  );
  return data;
}
