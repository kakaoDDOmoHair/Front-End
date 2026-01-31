// api BASE_URL 등록
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// 💡 ngrok에서 받은 새로운 주소를 여기에 넣으세요
const BASE_URL = "https://queenliest-profamily-jarrett.ngrok-free.dev";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

/**
 * 로그인 API(/api/v1/auth/login 등) 응답의 accessToken(JWT)을 저장소에서 가져옴.
 */
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
 * 모든 요청에 Authorization: Bearer {access_token} 자동 첨부.
 * - 헤더 이름: 반드시 "Authorization"
 * - 백엔드 규칙: 반드시 "Bearer " (B 대문자, 뒤 공백 한 칸). 소문자 bearer 또는 공백 없으면 인식 안 함.
 */
api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  const url = config.url ?? "";
  const isModifications = String(url).includes("/modifications");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 단계별 성공/실패 로그 (정정 요청 API 또는 __DEV__)
  if (isModifications || __DEV__) {
    const step1 = !!token;
    const step2 = !!config.headers?.Authorization;
    const step3 = config.headers?.Authorization
      ? /^Bearer\s+.+/.test(String(config.headers.Authorization))
      : false;
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`[요청] ${config.method?.toUpperCase()} ${url}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  (1) 저장소에서 토큰 조회        → ${step1 ? "✅ 성공" : "❌ 실패"}`);
    console.log(`  (2) Authorization 헤더 설정    → ${step2 ? "✅ 성공" : "❌ 실패"}`);
    console.log(`  (3) Bearer 형식 (B대문자+공백) → ${step3 ? "✅ 성공" : "❌ 실패"}`);
    console.log("  (4) 서버 응답 대기 중...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }

  return config;
});

/** 응답 시 (4) 단계 성공/실패 로그 */
api.interceptors.response.use(
  (res) => {
    const url = res.config?.url ?? "";
    if (String(url).includes("/modifications") || __DEV__) {
      const status = res.status;
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`[응답] ${res.config?.method?.toUpperCase()} ${url}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`  (4) 서버 응답 수신             → ${status >= 200 && status < 300 ? "✅ 성공" : "❌ 실패"} (${status})`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
    return res;
  },
  (err) => {
    const req = err?.config;
    const url = req?.url ?? "";
    const status = err?.response?.status;
    const isModifications = String(url).includes("/modifications");

    if (isModifications || __DEV__) {
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.warn(`[응답] ${req?.method?.toUpperCase()} ${url}`);
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.warn(`  (4) 서버 응답 수신             → ❌ 실패 (${status ?? "네트워크 오류"})`);
      console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    if (status === 401) {
      const auth = req?.headers?.Authorization;
      const tokenStr = typeof auth === "string" ? auth.replace(/^Bearer\s+/i, "").trim() : "";
      console.warn("[401 디버깅] 요청 상세", {
        url: req?.url,
        헤더_존재: !!auth,
        Bearer_형식: typeof auth === "string" && /^Bearer\s+/i.test(auth),
        토큰_글자수: tokenStr.length,
        response_data: err.response?.data,
      });
      if (isModifications) {
        console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.warn("[401] 백엔드에서 아래 (1)(2)(3) 단계 확인 필요");
        console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.warn("  (1) JWT 검증(만료·서명) 통과? → 서버 로그 확인");
        console.warn("  (2) findByUsername(subject)? → findByEmail 이면 조회 실패");
        console.warn("  (3) principal CustomUserDetails? → (2) 실패 시 null");
        console.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }
    }
    return Promise.reject(err);
  }
);

export default api;
