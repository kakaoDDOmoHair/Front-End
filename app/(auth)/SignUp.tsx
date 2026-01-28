import { CustomButton } from "@/components/common/CustomButton";
import { CustomInput } from "@/components/common/CustomInput";
import api from "@/constants/api";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../styles/auth/SignUp";

export default function SignUpScreen() {
  const router = useRouter();

  // 입력값 상태 관리
  const [username, SetUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "WORKER" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 통합 알림 함수
  const showAlert = (message: string) => {
    if (Platform.OS === "web") {
      alert(message);
    } else {
      Alert.alert("알림", message);
    }
  };

  const handleSignUp = async () => {
    Keyboard.dismiss();

    // --- 유효성 검사 ---
    if (!username.trim() || !name.trim() || !password.trim()) {
      showAlert("모든 정보를 입력해주세요.");
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      showAlert(
        "비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 합니다.",
      );
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showAlert("올바른 이메일 형식이 아닙니다.");
      return;
    }

    if (!role) {
      showAlert("역할을 선택해주세요.");
      return;
    }

    try {
      setIsLoading(true);

      // 1. 회원가입 API 호출
      const response = await api.post("/api/v1/users/join", {
        username: username,
        password: password,
        name: name,
        email: email,
        role: role,
      });

      // 2. 가입 성공 시 처리
      if (response.status === 200 || response.status === 201) {
        showAlert("회원가입이 완료되었습니다! 로그인 해주세요.");

        // 자동 로그인 대신 로그인 페이지로 이동
        router.replace("/(auth)/Login");
      }
    } catch (error: any) {
      console.error("회원가입 에러:", error.response?.data);
      const serverMessage =
        error.response?.data?.message ||
        "이미 가입된 정보이거나 서버 오류입니다.";
      showAlert(serverMessage);
    } finally {
      setIsLoading(false);
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
            onChangeText={SetUsername}
          />
          <CustomInput placeholder="이름" value={name} onChangeText={setName} />
          <CustomInput
            placeholder="비밀번호"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
          <CustomInput
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.roleSelectionContainer}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "OWNER" && styles.selectedRoleButton,
            ]}
            onPress={() => setRole("OWNER")}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "OWNER" && styles.selectedRoleButtonText,
              ]}
            >
              사장님
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "WORKER" && styles.selectedRoleButton,
            ]}
            onPress={() => setRole("WORKER")}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "WORKER" && styles.selectedRoleButtonText,
              ]}
            >
              아르바이트생
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.submitButtonContainer}>
          <CustomButton
            title={isLoading ? "처리 중..." : "가입하기"}
            onPress={handleSignUp}
          />
        </View>
      </View>
    </View>
  );
}
