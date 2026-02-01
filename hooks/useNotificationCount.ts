import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
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

  const loadCount = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        setCount(0);
        return;
      }
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      const res = await api.get<{ status?: string; data?: { count?: number } }>(
        "/api/v1/notifications/unread-count",
        { headers }
      ).catch(() => null);
      const raw = res?.data;
      const n = raw?.data?.count ?? raw?.count ?? 0;
      setCount(Number(n) || 0);
      if (__DEV__) console.log("[useNotificationCount] unread-count:", Number(n) || 0);
    } catch (e) {
      if (__DEV__) console.warn("[useNotificationCount] loadCount 실패", e);
      setCount(0);
    }
  }, []);

  useEffect(() => {
    loadCount();
  }, [loadCount, refetchTrigger]);

  useFocusEffect(
    useCallback(() => {
      loadCount();
    }, [loadCount])
  );

  useEffect(() => {
    const interval = setInterval(loadCount, 15000);
    return () => clearInterval(interval);
  }, [loadCount]);

  return count;
}
