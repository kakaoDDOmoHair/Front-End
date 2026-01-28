import { CustomButton } from "@/components/common/CustomButton";
import { CustomInput } from "@/components/common/CustomInput";
import api from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../styles/auth/FindId";

export default function FindPasswordScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setsUserName] = useState(""); // 비밀번호 찾기에는 아이디 입력이 필요함
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isPasswordVisible1, setIsPasswordVisible1] = useState(false);
  const [isPasswordVisible2, setIsPasswordVisible2] = useState(false);
  const [resetToken, setResetToken] = useState("");
  // 상태 관리
  const [isSent, setIsSent] = useState(false); // 메일 발송 여부
  const [isVerified, setIsVerified] = useState(false); // 인증 완료 여부 (새 비번 입력창 표시)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const showAlert = (message: string) => {
    if (Platform.OS === "web") alert(message);
    else Alert.alert("알림", message);
  };

  const handleAction = async () => {
    Keyboard.dismiss();

    try {
      if (!isSent) {
        // [1단계] 인증번호 발송 요청
        await api.post("/api/v1/auth/password/reset/check-user", {
          name,
          username,
          email,
        });
        setIsSent(true);
        showAlert("인증번호가 발송되었습니다.");
      } else if (!isVerified) {
        // [2단계] 인증번호 검증 및 resetToken 획득
        const response = await api.post(
          "/api/v1/auth/password/reset/verify-code",
          {
            username,
            email,
            authCode: verificationCode,
          },
        );

        // ✨ 서버 응답에서 토큰 추출 (구조 확인 필수: response.data 혹은 response.data.data)
        const token =
          response.data?.resetToken || response.data?.data?.resetToken;

        if (token) {
          setResetToken(token); // 상태에 저장
          console.log("✅ 토큰 획득 성공:", token);
          setIsVerified(true);
          showAlert("본인 인증에 성공했습니다.");
        } else {
          console.error("❌ 서버 응답에 토큰이 없습니다:", response.data);
          showAlert("인증 토큰을 받지 못했습니다.");
        }
      } else {
        // [3단계] 비밀번호 최종 변경
        if (newPassword !== confirmPassword) {
          showAlert("비밀번호가 일치하지 않습니다.");
          return;
        }

        if (!resetToken) {
          showAlert("인증 토큰이 만료되었습니다. 다시 인증해주세요.");
          setIsVerified(false);
          return;
        }

        // ✨ PATCH 요청 시 헤더에 resetToken을 반드시 포함
        await api.patch(
          "/api/v1/auth/password",
          {
            username: username, // 아이디 재확인
            newPassword: newPassword,
          },
          {
            headers: {
              // 서버 에러 메시지에 명시된 키값 그대로 사용
              resetToken: resetToken,
            },
          },
        );

        showAlert("비밀번호가 성공적으로 변경되었습니다.");
        router.replace("/(auth)/Login");
      }
    } catch (error: any) {
      console.error(
        "비밀번호 찾기 에러:",
        error.response?.data || error.message,
      );
      // 서버 에러 메시지를 그대로 출력하여 원인 파악
      const serverMessage =
        error.response?.data?.message || "오류가 발생했습니다.";
      showAlert(serverMessage);
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

        <View style={styles.inputContainer}>
          {!isVerified ? (
            <>
              <CustomInput
                placeholder="이름"
                value={name}
                onChangeText={setName}
                editable={!isSent}
              />
              <CustomInput
                placeholder="아이디"
                value={username}
                onChangeText={setsUserName}
                editable={!isSent}
              />
              <CustomInput
                placeholder="이메일 주소"
                value={email}
                onChangeText={setEmail}
                editable={!isSent}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {/* 인증번호 입력 부분 */}
              {isSent && (
                <CustomInput
                  placeholder="인증번호 6자리"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleAction}
                />
              )}
            </>
          ) : (
            <>
              {/* 새 비밀번호 입력창 */}
              <View
                style={{
                  width: "100%",
                  position: "relative",
                  justifyContent: "center",
                }}
              >
                <CustomInput
                  placeholder="새 비밀번호"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!isPasswordVisible1}
                />

                <TouchableOpacity
                  onPress={() => setIsPasswordVisible1(!isPasswordVisible1)}
                  style={{
                    position: "absolute",
                    right: 15,
                    zIndex: 1,
                    padding: 5,
                  }}
                >
                  <Ionicons
                    name={
                      isPasswordVisible1 ? "eye-outline" : "eye-off-outline"
                    }
                    size={22}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>

              {/* 비밀번호 확인창 */}
              <View
                style={{
                  width: "100%",
                  position: "relative",
                  justifyContent: "center",
                }}
              >
                <CustomInput
                  placeholder="새 비밀번호 확인"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!isPasswordVisible2}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible2(!isPasswordVisible2)}
                  style={{
                    position: "absolute",
                    right: 15,
                    zIndex: 1,
                    padding: 5,
                  }}
                >
                  <Ionicons
                    name={
                      isPasswordVisible2 ? "eye-outline" : "eye-off-outline"
                    }
                    size={22}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={styles.submitButtonContainer}>
          <CustomButton
            title={
              !isSent
                ? "본인인증 하기"
                : !isVerified
                  ? "인증 완료"
                  : "비밀번호 변경"
            }
            onPress={handleAction}
          />
        </View>
      </View>
    </View>
  );
}
