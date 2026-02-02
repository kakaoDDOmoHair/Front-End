/**
 * 알림 등에서 사용하는 "방금 전", "N분 전", "N시간 전" 표시용.
 * 사장님/알바생 알림 화면에서 동일한 기준으로 시간이 나오도록 공통 사용.
 */

/**
 * ISO 문자열 → Date.
 * 타임존 없을 때: **UTC 우선** 해석 (백엔드가 UTC로 보내고 Z 누락 시 "9시간 전" 오표기 방지).
 * UTC 해석이 미래면 로컬(KST)로 재해석 (KST를 UTC로 착각한 경우).
 */
function normalizeToDate(value: string | number | undefined): Date | null {
  if (value == null) return null;
  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  let s = String(value).trim();
  if (!s) return null;
  // "YYYY-MM-DD HH:mm:ss" 형태면 T로 바꿔서 파싱 (백엔드 일부 사용)
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) s = s.replace(/\s+/, "T");
  // 시간만 있는 형식(HH:MM:SS 또는 H:MM:SS.milliseconds) → 오늘 날짜 붙여서 파싱 (raw가 그대로 노출되는 것 방지)
  if (/^\d{1,2}:\d{2}(:\d{2})?(\.\d+)?$/.test(s)) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const fracMatch = s.match(/\.(\d+)/);
    const frac = fracMatch ? "." + fracMatch[1].slice(0, 3) : "";
    const timePart = s.replace(/\.\d+$/, "").slice(0, 8);
    s = `${y}-${m}-${d}T${timePart}${frac}`;
  }
  const hasOffset = /[Zz]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !hasOffset) {
    const noMs = s.replace(/\.\d{3}Z?$/i, "").replace(/Z$/i, "");
    const now = Date.now();
    const withZ = `${noMs}Z`;
    const dUtc = new Date(withZ);
    if (!Number.isNaN(dUtc.getTime())) {
      if (dUtc.getTime() <= now + 60000) return dUtc;
      const dLocal = new Date(noMs);
      if (!Number.isNaN(dLocal.getTime()) && dLocal.getTime() <= now + 60000) return dLocal;
      return dUtc;
    }
  }
  // 마이크로초(6자리) 등은 JS Date가 지원하지 않을 수 있음 → 밀리초(3자리)로 자름
  const d = new Date(s.replace(/\.(\d{3})\d+/, ".$1"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 정렬용: 같은 파싱 기준으로 타임스탬프 숫자 반환 (표시와 순서 일치) */
export function getSortTimestamp(value: string | number | undefined): number {
  const d = normalizeToDate(value);
  return d ? d.getTime() : 0;
}

/**
 * 날짜/시간 → "방금 전", "1분 전", "N분 전", "N시간 전", "하루 전", "N일 전", "이번 주"
 * - 1분 미만: "방금 전"
 * - 과거가 아니면(미래): "방금 전"
 */
export function formatRelativeTime(createdAt?: string | number): string {
  const date = normalizeToDate(createdAt);
  if (!date) return typeof createdAt !== "undefined" && createdAt !== "" ? "오늘" : "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMs < 0) return "방금 전";
  if (diffSec < 60) return "방금 전";
  if (diffM < 60) return `${diffM}분 전`;
  if (diffH < 24) return `${diffH}시간 전`;
  if (diffD === 1) return "하루 전";
  if (diffD < 7) return `${diffD}일 전`;
  return "이번 주";
}

/** 날짜 기준 "오늘" | "어제" | "이번 주" (알림 섹션용) */
export function getCategory(createdAt?: string | number): "오늘" | "어제" | "이번 주" {
  const date = normalizeToDate(createdAt);
  if (!date) return "이번 주";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const then = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffD = Math.floor((today.getTime() - then.getTime()) / 86400000);
  if (diffD === 0) return "오늘";
  if (diffD === 1) return "어제";
  return "이번 주";
}

/** parseDateForRelative 호환: 문자열만 받는 경우 (기존 코드용) */
export function parseDateForRelative(timeStr?: string): Date | null {
  return normalizeToDate(timeStr);
}
