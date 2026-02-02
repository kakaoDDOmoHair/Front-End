import React, { createContext, useCallback, useContext, useState } from "react";

type Role = "staff" | "boss";

type SetUnread = (n: number | null | ((prev: number | null) => number | null)) => void;

type UnreadState = {
  staffUnread: number | null;
  bossUnread: number | null;
  setStaffUnread: SetUnread;
  setBossUnread: SetUnread;
  refetchTrigger: number;
  triggerRefetch: () => void;
  scheduleRefetchTrigger: number;
  triggerScheduleRefetch: () => void;
};

export const UnreadNotificationContext = createContext<UnreadState | null>(null);

export function UnreadNotificationProvider({ children }: { children: React.ReactNode }) {
  const [staffUnread, setStaffUnread] = useState<number | null>(null);
  const [bossUnread, setBossUnread] = useState<number | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [scheduleRefetchTrigger, setScheduleRefetchTrigger] = useState(0);
  const setStaff = useCallback<SetUnread>((n) => {
    setStaffUnread((prev) => (typeof n === "function" ? n(prev) : n));
  }, []);
  const setBoss = useCallback<SetUnread>((n) => {
    setBossUnread((prev) => (typeof n === "function" ? n(prev) : n));
  }, []);
  const triggerRefetch = useCallback(() => setRefetchTrigger((t) => t + 1), []);
  const triggerScheduleRefetch = useCallback(() => setScheduleRefetchTrigger((t) => t + 1), []);
  const value: UnreadState = {
    staffUnread,
    bossUnread,
    setStaffUnread: setStaff,
    setBossUnread: setBoss,
    refetchTrigger,
    triggerRefetch,
    scheduleRefetchTrigger,
    triggerScheduleRefetch,
  };
  return (
    <UnreadNotificationContext.Provider value={value}>
      {children}
    </UnreadNotificationContext.Provider>
  );
}

export function useUnreadNotification(role: Role): number | null {
  const ctx = useContext(UnreadNotificationContext);
  if (!ctx) return null;
  return role === "staff" ? ctx.staffUnread : ctx.bossUnread;
}

export function useSetUnreadNotification(role: Role): SetUnread {
  const ctx = useContext(UnreadNotificationContext);
  if (!ctx) return () => {};
  return role === "staff" ? ctx.setStaffUnread : ctx.setBossUnread;
}

/** 근무 등록 등 이후 헤더 배지(미읽음 개수) 즉시 갱신용 */
export function useTriggerNotificationRefetch(): () => void {
  const ctx = useContext(UnreadNotificationContext);
  return ctx?.triggerRefetch ?? (() => {});
}

/** 수정 요청 승인 등 이후 스케줄/출퇴근 즉시 갱신용 */
export function useTriggerScheduleRefetch(): () => void {
  const ctx = useContext(UnreadNotificationContext);
  return ctx?.triggerScheduleRefetch ?? (() => {});
}

export function useScheduleRefetchTrigger(): number {
  const ctx = useContext(UnreadNotificationContext);
  return ctx?.scheduleRefetchTrigger ?? 0;
}
