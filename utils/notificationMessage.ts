/**
 * 알림 출근/퇴근 멘트 — 스태프·사장님 형식
 * - 스태프: "(HH:mm) 출근 완료!" / "(HH:mm) 퇴근 완료!" 통일
 * - 사장님: "(HH:mm) name님이 출근/퇴근했습니다."
 */

/** 알바생 전용: 출/퇴근 시간 + 출/퇴근 완료! 형식 통일 */
export function formatStaffAttendanceMessage(
  type: "in" | "out",
  timePart: string,
  options?: { isLate?: boolean; totalHours?: number }
): string {
  if (type === "in") {
    const base = options?.isLate
      ? `(${timePart}) 지각 출근 완료!`
      : `(${timePart}) 출근 완료!`;
    return options?.isLate ? `${base} 다음엔 일찍 와요!` : `${base} 오늘도 화이팅!`;
  }
  const hoursText =
    options?.totalHours != null
      ? ` 총 ${Math.round(options.totalHours * 10) / 10}시간 근무했어요.`
      : "";
  return `(${timePart}) 퇴근 완료!${hoursText} 고생했어요!`;
}

/** 사장님용: name님이 (HH:mm) 출근/퇴근했습니다. (기존 형식) */
export function formatAttendanceMessage(
  type: "in" | "out",
  timePart: string,
  options?: { isLate?: boolean; totalHours?: number; namePrefix?: string }
): string {
  const prefix = options?.namePrefix ?? "";
  if (type === "in") {
    const msg = options?.isLate
      ? `(${timePart}) 지각 출근했습니다.`
      : `(${timePart}) 출근했습니다.`;
    return prefix + msg;
  }
  const hoursText =
    options?.totalHours != null
      ? ` 총 ${Math.round(options.totalHours * 10) / 10}시간 근무했습니다.`
      : "";
  return prefix + `(${timePart}) 퇴근했습니다.${hoursText}`;
}

/** 시간 없을 때 (fallback) */
export function formatAttendanceMessageNoTime(
  type: "in" | "out",
  options?: { isLate?: boolean; namePrefix?: string }
): string {
  const prefix = options?.namePrefix ?? "";
  if (type === "in") {
    const msg = options?.isLate ? "지각 출근했습니다." : "출근했습니다.";
    return prefix + msg;
  }
  return prefix + "퇴근했습니다.";
}
