import { CustomButton } from "@/components/common/CustomButton";
import { CustomInput } from "@/components/common/CustomInput";
import api from "@/constants/api";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../styles/auth/FindId";

export default function FindIdScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [maskedId, setMaskedId] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const mockUserDB = [
    { name: "고지운", Id: "jun" },
    { name: "김도홍", Id: "hong" },
    { name: "김현아", Id: "annie" },
    { name: "정준영", Id: "crong" },
  ];

  const showAlert = (message: string) => {
    if (Platform.OS === "web") {
      alert(message);
    } else {
      Alert.alert("알림", message);
    }
  };

  const handleAction = async () => {
    // 1단계: 메일 발송 (isSent가 false일 때)
    if (!isSent) {
      try {
        const response = await api.post("/api/v1/auth/find-id/send-code", {
          name: name.trim(),
          email: email.trim(),
        });
        if (response.status === 200) {
          setIsSent(true); // 여기서 true로 바뀌어야 다음 클릭 시 '인증' 로직으로 감
          showAlert("인증번호가 발송되었습니다.");
        }
      } catch (error: any) {
        console.error("발송 에러:", error.response?.data);
        showAlert("메일 발송에 실패했습니다.");
      }
      return;
    }

    // 2단계: 인증 확인 (isSent가 true일 때)
    try {
      const response = await api.post("/api/v1/auth/find-id/verify", {
        email: email.trim(),
        authCode: verificationCode, // 백엔드와 이 Key 이름이 맞는지 꼭 확인!
      });

      if (response.status === 200) {
        setMaskedId(response.data.maskedId || response.data.email);
        setIsVerified(true);
      }
    } catch (error: any) {
      // 500 에러가 나면 이쪽으로 들어옵니다.
      console.log("서버 응답 상세:", error.response?.data);
      const msg =
        error.response?.data?.message || "인증번호가 일치하지 않습니다.";
      showAlert(msg);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. 결과 팝업 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVerified}
        onRequestClose={() => setIsVerified(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.resultText}>
              <Text style={{ fontWeight: "bold" }}>{name}</Text>님의 ID는
              <Text style={{ fontWeight: "bold", color: "#6C5CE7" }}>
                {maskedId}
              </Text>
              입니다.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => {
                  setIsVerified(false);
                  router.replace("/(auth)/Login");
                }}
              >
                <Text style={styles.smallButtonText}>로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => {
                  setIsVerified(false);
                  router.replace("/(auth)/FindPw");
                }}
              >
                <Text style={styles.smallButtonText}>비밀번호 찾기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. 메인 입력 화면 */}
      <View style={styles.innerContainer}>
        {/* ✨ 메인 화면 로고 복구 */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logoImage}
          />
        </View>

        <View style={styles.inputContainer}>
          <CustomInput
            placeholder="이름"
            value={name}
            onChangeText={setName}
            editable={!isSent}
          />
          <CustomInput
            placeholder="이메일주소"
            value={email}
            onChangeText={setEmail}
            editable={!isSent}
          />
          {isSent && (
            <CustomInput
              placeholder="인증번호 6자리"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          )}
        </View>

        <View style={styles.submitButtonContainer}>
          <CustomButton
            title={isSent ? "인증하기" : "메일 발송"}
            onPress={handleAction}
          />
        </View>
        <View style={{ height: 30, marginTop: 10 }} />
      </View>
    </View>
  );
}
