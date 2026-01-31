import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import api from "../constants/api";
import { fetchModifications } from "../services/modificationApi";

/**
 * 알림 API 연동 — 헤더 배지에 표시할 "온 알림 개수".
 * staff: 정정 승인(APPROVED) 건수, boss: 대기 중 수정/삭제 요청(PENDING) 건수.
 */
export function useNotificationCount(role: "staff" | "boss"): number {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    try {
      const username = await AsyncStorage.getItem("username");
      if (!username) {
        setCount(0);
        return;
      }
      const token =
        Platform.OS === "web"
          ? (typeof localStorage !== "undefined" ? localStorage.getItem("user_token") : null)
          : await AsyncStorage.getItem("user_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const meRes = await api.get("/api/v1/users/me", { params: { username }, headers }).catch(() => null);
      if (!meRes?.data) {
        setCount(0);
        return;
      }
      const me = meRes.data?.data ?? meRes.data;
      const storeId = me?.storeId ?? null;
      const userId = me?.userId ?? me?.id ?? null;
      if (storeId == null) {
        setCount(0);
        return;
      }
      const id = Number(storeId);
      if (role === "boss") {
        const list = await fetchModifications({ storeId: id, status: "PENDING" }, headers).catch(() => []);
        setCount(Array.isArray(list) ? list.length : 0);
      } else {
        const uid = userId != null ? Number(userId) : null;
        if (uid == null) {
          setCount(0);
          return;
        }
        const list = await fetchModifications(
          { storeId: id, requesterId: uid, status: "APPROVED" },
          headers
        ).catch(() => []);
        setCount(Array.isArray(list) ? list.length : 0);
      }
    } catch {
      setCount(0);
    }
  }, [role]);

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  useFocusEffect(
    useCallback(() => {
      loadCount();
    }, [loadCount])
  );

  return count;
}
