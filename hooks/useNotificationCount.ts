import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import api from "../constants/api";
import { UnreadNotificationContext } from "../contexts/UnreadNotificationContext";

async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem("user_token") : null;
    }
    let token = await SecureStore.getItemAsync("user_token");
    if (!token) token = await AsyncStorage.getItem("user_token");
    return token;
  } catch {
    return null;
  }
}

/**
 * 홈 화면 종 모양 아이콘 위 배지용 — GET /api/v1/notifications/unread-count 사용.
 * - Authorization: Bearer {token} 만 전달 (백엔드에서 토큰으로 로그인 유저 식별 후 count 반환).
 * - 응답: { "status": "success", "data": { "count": <해당 유저의 미읽음 개수> } }
 * - 스케줄 등록 시 해당 알바생에게 알림 1건(isRead=false) 생성 → data.count 1 증가.
 */
export function useNotificationCount(_role: "staff" | "boss"): number {
  const [count, setCount] = useState(0);
  const refetchTrigger = useContext(UnreadNotificationContext)?.refetchTrigger ?? 0;
  const pathname = usePathname();

  const loadCount = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        setCount(0);
        return;
      }
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      };
      const res = await api.get<{ status?: string; data?: { count?: number }; count?: number }>(
        "/api/v1/notifications/unread-count",
        { headers, params: { _t: Date.now() } }
      ).catch(() => null);
      const raw = res?.data;
      const n = raw?.data?.count ?? raw?.count ?? 0;
      const num = typeof n === "number" && Number.isFinite(n) ? n : parseInt(String(n), 10);
      const value = Number.isFinite(num) && num >= 0 ? num : 0;
      setCount(value);
      if (__DEV__) console.log("[useNotificationCount] unread-count:", value);
    } catch (e) {
      if (__DEV__) console.warn("[useNotificationCount] loadCount 실패", e);
      setCount(0);
    }
  }, []);

  // 로그인 후 refetchTrigger 변경 시, 페이지 이동(pathname) 시마다 갱신
  useEffect(() => {
    loadCount();
  }, [loadCount, refetchTrigger, pathname]);

  useFocusEffect(
    useCallback(() => {
      loadCount();
    }, [loadCount])
  );

  // 앱이 포그라운드로 돌아올 때 즉시 갱신 (다른 탭/앱 갔다 와도 숫자 반영)
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        loadCount();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [loadCount]);

  // 헤더 알림 개수 짧은 간격으로 갱신 (3초 — 실시간에 가깝게)
  useEffect(() => {
    const interval = setInterval(loadCount, 3000);
    return () => clearInterval(interval);
  }, [loadCount]);

  return typeof count === "number" && Number.isFinite(count) && count >= 0 ? count : 0;
}
