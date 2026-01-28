import { CustomButton } from "@/components/common/CustomButton";
import { CustomInput } from "@/components/common/CustomInput";
import api from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../styles/auth/Login";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const saveToken = async (token: string) => {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem("user_token", token);
      } else {
        await SecureStore.setItemAsync("user_token", token);
      }
      console.log("✅ 토큰 저장 완료:", token);
    } catch (e) {
      console.error("❌ 토큰 저장 중 오류:", e);
    }
  };

  const showAlert = (message: string) => {
    if (Platform.OS === "web") {
      alert(message);
    } else {
      Alert.alert("알림", message);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      showAlert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      // 1. 로그인 요청
      const response = await api.post("/api/v1/auth/login", {
        username: username,
        password: password,
      });

      const result = response.data;

      // 🔍 [지운님 요청 사항: 디버깅 로그 출력] -----------------------
      console.log("=========================================");
      console.log("🚀 로그인 성공 응답 데이터 확인");
      console.log("👤 내 UserId   :", result.userId);
      console.log("🏪 내 StoreId  :", result.storeId);
      console.log(
        "🔑 AccessToken :",
        result.accessToken ? "발급 완료" : "없음",
      );
      console.log("🛡️ 권한(Role)  :", result.role);
      console.log("=========================================");
      // -----------------------------------------------------------

      if (result.accessToken) {
        // 1. 토큰 저장
        await saveToken(result.accessToken);

        // 2. 세션 정보 저장 (AsyncStorage는 문자열만 가능하므로 String으로 변환)
        await AsyncStorage.setItem("username", username);
        if (result.userId)
          await AsyncStorage.setItem("userId", String(result.userId));
        if (result.storeId)
          await AsyncStorage.setItem("storeId", String(result.storeId));
        if (result.role) await AsyncStorage.setItem("userRole", result.role);

        showAlert(`${result.name || username}님 환영합니다!`);

        // 3. 역할(Role)에 따른 페이지 이동
        if (result.role === "OWNER") {
          router.replace("/(tabs)/boss/Dashboard");
        } else if (result.role === "WORKER") {
          router.replace("/(tabs)/staff/Dashboard");
        } else {
          router.replace("/(tabs)/boss/Dashboard");
        }
      }
    } catch (error: any) {
      console.error(
        "❌ 로그인 실패 상세:",
        error.response?.data || error.message,
      );
      showAlert("로그인 정보가 일치하지 않거나 서버 오류가 발생했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logoImage}
          />
        </View>

        <View style={styles.inputContainer}>
          <CustomInput
            placeholder="아이디"
            value={username}
            onChangeText={setUsername}
          />
          <View
            style={{
              width: "100%",
              position: "relative",
              justifyContent: "center",
            }}
          >
            <CustomInput
              placeholder="비밀번호"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={{
                position: "absolute",
                right: 15,
                zIndex: 1,
                padding: 5,
                marginBottom: 5,
              }}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#333"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.submitButtonContainer}>
          <CustomButton title="로그인" onPress={handleLogin} />
        </View>

        <View style={styles.linkContainer}>
          <TouchableOpacity onPress={() => router.push("/(auth)/FindId")}>
            <Text style={styles.linkText}>아이디 찾기</Text>
          </TouchableOpacity>
          <Text style={styles.divider}>|</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/FindPw")}>
            <Text style={styles.linkText}>비밀번호 찾기</Text>
          </TouchableOpacity>
          <Text style={styles.divider}>|</Text>
          <Link href="/SignUp" asChild>
            <TouchableOpacity>
              <Text
                style={[styles.linkText, { fontWeight: "bold", color: "#000" }]}
              >
                가입하기
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
