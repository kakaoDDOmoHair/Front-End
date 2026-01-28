import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { BOSS_DATA } from "../../../components/profile/BossData";
import BossProfile from "../../../components/profile/BossProfile";
import api from "../../../constants/api"; // 📡 API 모듈 import
import { modalStyles, styles } from "../../../styles/tabs/boss/Profile";

export default function ProfileScreen() {
  const router = useRouter();

  // --- 유저 정보 상태 ---
  const [username, setUsername] = useState("");

  // --- 모달 상태 ---
  const [isChangeModalVisible, setChangeModalVisible] = useState(false);
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [isWithdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [isWithdrawSuccessVisible, setWithdrawSuccessVisible] = useState(false);

  // --- 입력값 및 에러 상태 ---
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [currentPwError, setCurrentPwError] = useState("");
  const [withdrawPwError, setWithdrawPwError] = useState("");

  // --- 가시성 및 동의 상태 ---
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showWithdrawPw, setShowWithdrawPw] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  // ✅ 초기 로딩: 저장된 username 가져오기
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedName = await AsyncStorage.getItem("username");
        if (storedName) setUsername(storedName);
      } catch (e) {
        console.error("유저 정보 로드 실패", e);
      }
    };
    loadUser();
  }, []);

  // ✅ 초기화 함수: 비밀번호 변경
  const resetChangeInputs = () => {
    setPasswords({ current: "", next: "", confirm: "" });
    setCurrentPwError("");
    setShowCurrent(false);
    setShowNext(false);
    setShowConfirm(false);
  };

  // ✅ 초기화 함수: 회원 탈퇴
  const resetWithdrawInputs = () => {
    setWithdrawPassword("");
    setWithdrawPwError("");
    setShowWithdrawPw(false);
    setIsAgreed(false);
  };

  const validatePassword = (pw: string) => {
    // 영문, 숫자, 특수문자 포함 8자 이상
    const regex =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pw);
  };

  const isNextValid = validatePassword(passwords.next);
  const isMatch =
    passwords.next === passwords.confirm && passwords.confirm.length > 0;
  const canSave = passwords.current.length > 0 && isNextValid && isMatch;

  // 📡 비밀번호 변경 API 호출
  const handleSavePassword = async () => {
    if (!canSave) return;

    try {
      const response = await api.patch("/api/v1/users/password", {
        username: username,
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });

      if (response.data.success) {
        setChangeModalVisible(false);
        setSuccessModalVisible(true); // 성공 모달 띄우기
        resetChangeInputs();
      }
    } catch (error: any) {
      console.error("비밀번호 변경 실패:", error.response?.data);
      if (error.response?.status === 400) {
        setCurrentPwError("현재 비밀번호가 일치하지 않습니다.");
      } else {
        Alert.alert("오류", "비밀번호 변경 중 문제가 발생했습니다.");
      }
    }
  };

  // 📡 회원 탈퇴 API 호출
  const handleWithdrawal = async () => {
    if (!withdrawPassword || !isAgreed) return;

    try {
      // DELETE 메서드에 body를 보낼 때는 { data: { ... } } 형태로 보내야 함 (Axios 규격)
      const response = await api.delete("/api/v1/users/withdraw", {
        data: {
          username: username,
          password: withdrawPassword,
        },
      });

      if (response.data.status === "success") {
        setWithdrawModalVisible(false);
        setWithdrawSuccessVisible(true); // 성공 모달 띄우기
        resetWithdrawInputs();

        // 로컬 스토리지 비우기
        await AsyncStorage.clear();
      }
    } catch (error: any) {
      console.error("회원 탈퇴 실패:", error.response?.data);
      const status = error.response?.status;

      if (status === 400 || status === 401) {
        setWithdrawPwError("비밀번호가 일치하지 않습니다.");
      } else if (status === 409) {
        Alert.alert(
          "탈퇴 불가",
          "미지급된 급여가 남아있어 탈퇴할 수 없습니다.",
        );
      } else {
        Alert.alert("오류", "회원 탈퇴 처리에 실패했습니다.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={{ width: 90, height: 70 }}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => router.push("./notification")}>
          <View style={{ position: "relative" }}>
            <Ionicons name="notifications" size={24} color="#D1C4E9" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
      >
        <BossProfile data={BOSS_DATA} />

        <Text style={styles.sectionTitle}>매장 기록</Text>
        {/* 사업자 정보 페이지로 이동 */}
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => router.push("/boss/BossInfo")}
        >
          <Text style={styles.menuText}>사업자 정보</Text>
          <Ionicons name="chevron-forward" size={18} color="#AFAFAF" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>계정 정보</Text>
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setChangeModalVisible(true)}
        >
          <Text style={styles.menuText}>비밀번호 변경</Text>
          <Ionicons name="chevron-forward" size={18} color="#AFAFAF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          activeOpacity={0.7}
          onPress={() => setWithdrawModalVisible(true)}
        >
          <Text style={styles.menuText}>회원 탈퇴</Text>
          <Ionicons name="chevron-forward" size={18} color="#AFAFAF" />
        </TouchableOpacity>
      </ScrollView>

      {/* 1. 비밀번호 변경 모달 */}
      <Modal visible={isChangeModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={modalStyles.overlay}
          >
            <View style={modalStyles.modalContainer}>
              <Text style={modalStyles.modalTitle}>비밀번호 변경</Text>
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                <View style={modalStyles.inputGroup}>
                  <Text style={modalStyles.label}>현재 비밀번호</Text>
                  <View
                    style={[
                      modalStyles.passwordInputWrapper,
                      currentPwError !== "" && modalStyles.inputError,
                    ]}
                  >
                    <TextInput
                      style={modalStyles.inputWithIcon}
                      placeholder="현재 비밀번호를 입력해 주세요."
                      placeholderTextColor="#AFAFAF"
                      secureTextEntry={!showCurrent}
                      value={passwords.current}
                      onChangeText={(text) => {
                        setPasswords({ ...passwords, current: text });
                        if (currentPwError) setCurrentPwError("");
                      }}
                    />
                    {passwords.current.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setShowCurrent(!showCurrent)}
                        style={modalStyles.eyeIcon}
                      >
                        <Ionicons
                          name={showCurrent ? "eye-outline" : "eye-off-outline"}
                          size={18}
                          color="#AFAFAF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {currentPwError !== "" && (
                    <Text style={modalStyles.errorText}>{currentPwError}</Text>
                  )}
                </View>

                <View style={modalStyles.inputGroup}>
                  <Text style={modalStyles.label}>새 비밀번호</Text>
                  <View
                    style={[
                      modalStyles.passwordInputWrapper,
                      passwords.next.length > 0 &&
                        !isNextValid &&
                        modalStyles.inputError,
                    ]}
                  >
                    <TextInput
                      style={modalStyles.inputWithIcon}
                      placeholder="영문, 숫자 포함 8자 이상 입력해 주세요."
                      placeholderTextColor="#AFAFAF"
                      secureTextEntry={!showNext}
                      value={passwords.next}
                      onChangeText={(text) =>
                        setPasswords({ ...passwords, next: text })
                      }
                    />
                    {passwords.next.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setShowNext(!showNext)}
                        style={modalStyles.eyeIcon}
                      >
                        <Ionicons
                          name={showNext ? "eye-outline" : "eye-off-outline"}
                          size={18}
                          color="#AFAFAF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {passwords.next.length > 0 && !isNextValid && (
                    <Text style={modalStyles.errorText}>
                      영문/숫자/특수문자 포함 8자 이상이어야 합니다.
                    </Text>
                  )}
                </View>

                <View style={modalStyles.inputGroup}>
                  <Text style={modalStyles.label}>새 비밀번호 확인</Text>
                  <View
                    style={[
                      modalStyles.passwordInputWrapper,
                      passwords.confirm.length > 0 &&
                        !isMatch &&
                        modalStyles.inputError,
                    ]}
                  >
                    <TextInput
                      style={modalStyles.inputWithIcon}
                      placeholder="한 번 더 입력해 주세요."
                      placeholderTextColor="#AFAFAF"
                      secureTextEntry={!showConfirm}
                      value={passwords.confirm}
                      onChangeText={(text) =>
                        setPasswords({ ...passwords, confirm: text })
                      }
                    />
                    {passwords.confirm.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setShowConfirm(!showConfirm)}
                        style={modalStyles.eyeIcon}
                      >
                        <Ionicons
                          name={showConfirm ? "eye-outline" : "eye-off-outline"}
                          size={18}
                          color="#AFAFAF"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {passwords.confirm.length > 0 && !isMatch && (
                    <Text style={modalStyles.errorText}>
                      비밀번호가 일치하지 않습니다.
                    </Text>
                  )}
                </View>
              </ScrollView>

              <View style={modalStyles.buttonRow}>
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={() => {
                    setChangeModalVisible(false);
                    resetChangeInputs();
                  }}
                >
                  <Text style={modalStyles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    modalStyles.saveBtn,
                    !canSave && modalStyles.saveBtnDisabled,
                  ]}
                  onPress={handleSavePassword}
                  disabled={!canSave}
                >
                  <Text
                    style={[
                      modalStyles.saveBtnText,
                      { color: canSave ? "#9747FF" : "#AFAFAF" },
                    ]}
                  >
                    저장
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. 비밀번호 변경 성공 모달 */}
      <Modal visible={isSuccessModalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View
            style={[
              modalStyles.modalContainer,
              { alignItems: "center", paddingVertical: 40 },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={60}
              color="#9747FF"
              style={{ marginBottom: 15 }}
            />
            <Text style={modalStyles.successTitle}>변경 완료</Text>
            <Text style={modalStyles.successDesc}>
              비밀번호가 성공적으로 변경되었습니다.
            </Text>
            <TouchableOpacity
              style={modalStyles.confirmBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                router.replace("/(auth)/Login");
              }} // 재로그인 유도
            >
              <Text style={modalStyles.confirmBtnText}>확인 (재로그인)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. 회원 탈퇴 모달 */}
      <Modal visible={isWithdrawModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={modalStyles.overlay}
          >
            <View style={modalStyles.modalContainer}>
              <Text style={modalStyles.modalTitle}>회원 탈퇴</Text>
              <View style={modalStyles.withdrawWarningBox}>
                <Text style={modalStyles.withdrawWarningText}>
                  정말로 PayMate를 떠나시겠어요?
                </Text>
                <Text style={modalStyles.withdrawWarningText}>
                  탈퇴 시 모든 데이터가{" "}
                  <Text style={{ color: "#FF383C", fontWeight: "bold" }}>
                    삭제
                  </Text>
                  됩니다.
                </Text>
              </View>

              <View style={modalStyles.inputGroup}>
                <Text style={modalStyles.label}>현재 비밀번호 확인</Text>
                <View
                  style={[
                    modalStyles.passwordInputWrapper,
                    withdrawPwError !== "" && modalStyles.inputError,
                  ]}
                >
                  <TextInput
                    style={modalStyles.inputWithIcon}
                    placeholder="비밀번호를 입력해 주세요."
                    placeholderTextColor="#AFAFAF"
                    secureTextEntry={!showWithdrawPw}
                    value={withdrawPassword}
                    onChangeText={(text) => {
                      setWithdrawPassword(text);
                      if (withdrawPwError) setWithdrawPwError("");
                    }}
                  />
                  {withdrawPassword.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setShowWithdrawPw(!showWithdrawPw)}
                      style={modalStyles.eyeIcon}
                    >
                      <Ionicons
                        name={
                          showWithdrawPw ? "eye-outline" : "eye-off-outline"
                        }
                        size={18}
                        color="#AFAFAF"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {withdrawPwError !== "" && (
                  <Text style={modalStyles.errorText}>{withdrawPwError}</Text>
                )}
              </View>

              <TouchableOpacity
                style={modalStyles.checkboxRow}
                onPress={() => setIsAgreed(!isAgreed)}
              >
                <Ionicons
                  name={isAgreed ? "checkbox" : "square-outline"}
                  size={22}
                  color={isAgreed ? "#E0D5FF" : "#AFAFAF"}
                />
                <Text style={modalStyles.checkboxLabel}>
                  안내 사항을 숙지하였으며, 탈퇴에 동의합니다.
                </Text>
              </TouchableOpacity>

              <View style={modalStyles.buttonRow}>
                <TouchableOpacity
                  style={modalStyles.cancelBtn}
                  onPress={() => {
                    setWithdrawModalVisible(false);
                    resetWithdrawInputs();
                  }}
                >
                  <Text style={modalStyles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    modalStyles.saveBtn,
                    !(withdrawPassword && isAgreed) &&
                      modalStyles.saveBtnDisabled,
                  ]}
                  onPress={handleWithdrawal}
                  disabled={!(withdrawPassword && isAgreed)}
                >
                  <Text
                    style={[
                      modalStyles.saveBtnText,
                      {
                        color:
                          withdrawPassword && isAgreed ? "#9747FF" : "#AFAFAF",
                      },
                    ]}
                  >
                    탈퇴하기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 4. 탈퇴 성공 모달 */}
      <Modal
        visible={isWithdrawSuccessVisible}
        transparent
        animationType="fade"
      >
        <View style={modalStyles.overlay}>
          <View
            style={[
              modalStyles.modalContainer,
              { alignItems: "center", paddingVertical: 40 },
            ]}
          >
            <View style={modalStyles.doorCircle}>
              <Ionicons name="exit-outline" size={65} color="#E0D5FF" />
            </View>
            <Text style={modalStyles.successTitle}>탈퇴 완료</Text>
            <Text style={modalStyles.successDesc}>
              이용해 주셔서 감사합니다.
            </Text>
            <TouchableOpacity
              style={modalStyles.confirmBtn}
              onPress={() => {
                setWithdrawSuccessVisible(false);
                router.replace("/(auth)/Login");
              }}
            >
              <Text style={modalStyles.confirmBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
