import { CustomButton } from "@/components/common/CustomButton";
import { CustomInput } from "@/components/common/CustomInput";
import api from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
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
      console.log("토큰 저장 완료:", token);
    } catch (e) {
      console.error("토큰 저장 중 오류:", e);
    }
  };
  // 🔥 웹/모바일 어디서든 알림이 뜨게 하는 통합 함수
  const showAlert = (message: string) => {
    if (Platform.OS === "web") {
      alert(message); // 웹 브라우저 환경
    } else {
      Alert.alert("알림", message);
    }
  };

  // axios 또는 fetch를 사용하기 위해 함수 앞에 async를 붙입니다.
  const handleLogin = async () => {
    if (!username.trim()) {
      showAlert("아이디를 입력해주세요.");
      return;
    }

    // 2. 비밀번호 입력 여부 확인
    if (!password.trim()) {
      showAlert("비밀번호를 입력해주세요.");
      return;
    }

    // 3. 비밀번호 상세 검사 (보안 정책)
    // 최소 8자 이상
    if (password.length < 8) {
      showAlert("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    // 정규식: 영문, 숫자, 특수문자 조합 확인
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      showAlert("비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.");
      return;
    }

    // 4. 모든 검증 통과 시 백엔드 API 호출

    try {
      // 1. 요청 보내기 (Postman 확인 결과 필드명은 email입니다)
      const response = await api.post("/api/v1/auth/login", {
        username: username,
        password: password,
      });

      // 2. 응답 데이터 처리 (axios는 자동으로 JSON 파싱을 해줍니다)
      const result = response.data;

      if (result.accessToken) {
        await saveToken(result.accessToken);
        showAlert(`${result.name || username}님 환영합니다!`);
        router.replace("/(tabs)/boss/Dashboard");
      }
    } catch (error: any) {
      // 3. 에러 상세 확인
      console.log("에러 상태 코드:", error.response?.status);
      console.log("에러 데이터:", error.response?.data); // 여기서 HTML이 오는지 확인 가능

      if (error.response?.status === 404) {
        showAlert("서버 경로를 찾을 수 없습니다 (404).");
      } else {
        showAlert("로그인 정보가 일치하지 않거나 서버 오류가 발생했습니다.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {/* 로고 영역 */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logoImage}
          />
        </View>

        {/* 입력 영역: 공용 컴포넌트 사용 */}
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

        {/* 로그인 버튼: 공용 컴포넌트 사용 */}
        <View style={styles.submitButtonContainer}>
          <CustomButton
            title="로그인"
            onPress={() => {
              handleLogin();
            }}
          />
        </View>

        {/* 하단 링크 영역 */}
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
