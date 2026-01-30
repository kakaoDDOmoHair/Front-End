import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
    ActivityIndicator,
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
import {
    StaffProfileData,
    UsersMeResponse,
} from "../../../components/profile/StaffData";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import StaffProfile from "../../../components/profile/StaffProfile";
import api from "../../../constants/api";
import { modalStyles, styles } from "../../../styles/tabs/staff/Profile";

/** 생일 문자열 → YYYY.MM.DD (YYMMDD 6자리, YYYYMMDD 8자리, 또는 그대로 반환) */
function formatBirthDate(raw: string): string {
  if (!raw || typeof raw !== "string") return raw ?? "";
  const s = String(raw).replace(/\D/g, "");
  if (s.length === 6) {
    const yy = s.slice(0, 2);
    const mm = s.slice(2, 4);
    const dd = s.slice(4, 6);
    const yyyy = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    return `${yyyy}.${mm}.${dd}`;
  }
  if (s.length === 8) {
    return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
  }
  return raw;
}

/** users/me 응답을 StaffProfileData로 변환 */
function mapUsersMeToProfileData(res: UsersMeResponse): StaffProfileData {
  const rawBirth = res.birthDate ?? res.birth_date ?? res.birthday ?? "";
  const birthday = rawBirth ? formatBirthDate(rawBirth) : undefined;
  return {
    name: res.name ?? "",
    email: res.email ?? "",
    birthday: birthday || undefined,
    joinDate: res.joinDate,
    role: res.role,
  };
}

export default function StaffProfileScreen() {
  const router = useRouter();

  // --- 프로필 데이터 (users/me API) ---
  const [profileData, setProfileData] = useState<StaffProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // --- 모달 상태 관리 ---
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
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [notificationCount] = useState(0);

  // --- users/me API 호출 (알바생 이름, 이메일, 생일 등) ---
  React.useEffect(() => {
    let cancelled = false;

    const fetchMe = async () => {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const username = await AsyncStorage.getItem("username");
        if (!username?.trim()) {
          if (!cancelled) {
            setProfileError("로그인 정보를 찾을 수 없습니다.");
            setProfileData(null);
          }
          return;
        }
        const headers = await getAuthHeader();
        const { data } = await api.get<UsersMeResponse>("/api/v1/users/me", {
          params: { username },
          headers,
        });

        // [디버그] 알바생 정보 확인 → 콘솔에 안 보이면 API 실패/경로/토큰 확인.
        // 생년월일이 없으면 원본 응답에 birthDate/birth_date/birthday 필드 있는지 확인 후 백엔드에 전달 요청.
        console.log("[Profile] GET /api/v1/users/me 원본 응답:", JSON.stringify(data, null, 2));
        const mapped = mapUsersMeToProfileData(data);
        console.log("[Profile] 매핑된 프로필 (화면에 쓰는 값):", {
          name: mapped.name,
          email: mapped.email,
          birthday: mapped.birthday,
          "birthday 있음?": !!mapped.birthday,
        });

        if (!cancelled) {
          setProfileData(mapped);
        }
      } catch (err: any) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 401) {
          clearTokenAndRedirectToLogin();
          return;
        }
        setProfileError(
          err.response?.data?.message ?? "프로필을 불러오지 못했습니다."
        );
        setProfileData(null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    fetchMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const getAuthHeader = async () => {
    let token: string | null = null;
    try {
      if (Platform.OS === "web") token = localStorage.getItem("user_token");
      else {
        token = await SecureStore.getItemAsync("user_token");
        if (!token) token = await AsyncStorage.getItem("user_token");
      }
    } catch (_) {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const clearTokenAndRedirectToLogin = async () => {
    try {
      if (Platform.OS === "web") localStorage.removeItem("user_token");
      else {
        await SecureStore.deleteItemAsync("user_token");
        await AsyncStorage.removeItem("user_token");
      }
    } catch (_) {}
    router.replace("/(auth)/Login");
  };

  // ✅ 초기화 함수
  const resetChangeInputs = () => {
    setPasswords({ current: "", next: "", confirm: "" });
    setCurrentPwError("");
    setShowCurrent(false);
    setShowNext(false);
    setShowConfirm(false);
  };

  const resetWithdrawInputs = () => {
    setWithdrawPassword("");
    setWithdrawPwError("");
    setShowWithdrawPw(false);
    setIsAgreed(false);
  };

  // ✅ 검증 로직
  const validatePassword = (pw: string) => {
    const regex =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pw);
  };

  const isNextValid = validatePassword(passwords.next);
  const isMatch =
    passwords.next === passwords.confirm && passwords.confirm.length > 0;
  const canSave = passwords.current.length > 0 && isNextValid && isMatch;

  // ✅ 핸들러 함수 (API 연동)
  const handleSavePassword = async () => {
    if (!canSave) return;
    const username = await AsyncStorage.getItem("username");
    if (!username) {
      Alert.alert("알림", "로그인 정보를 찾을 수 없습니다.");
      return;
    }
    setPasswordLoading(true);
    setCurrentPwError("");
    try {
      const headers = await getAuthHeader();
      await api.patch(
        "/api/v1/users/password",
        {
          username,
          currentPassword: passwords.current,
          newPassword: passwords.next,
        },
        { headers },
      );
      setChangeModalVisible(false);
      setSuccessModalVisible(true);
      resetChangeInputs();
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 400) {
        setCurrentPwError(message || "현재 비밀번호가 일치하지 않습니다.");
      } else {
        Alert.alert("알림", message || "비밀번호 변경에 실패했습니다.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // 회원 탈퇴 API (DELETE /api/v1/users/withdraw) - 외래키 정리 후 사용자 삭제 처리됨
  const handleWithdrawal = async () => {
    if (!withdrawPassword || !isAgreed) return;
    const username = await AsyncStorage.getItem("username");
    if (!username) {
      Alert.alert("알림", "로그인 정보를 찾을 수 없습니다.");
      return;
    }
    setWithdrawLoading(true);
    setWithdrawPwError("");
    try {
      const headers = await getAuthHeader();
      const response = await api.delete("/api/v1/users/withdraw", {
        data: { username, password: withdrawPassword },
        headers,
      });
      if (response.status === 200 && response.data?.status === "success") {
        setWithdrawModalVisible(false);
        setWithdrawSuccessVisible(true);
        resetWithdrawInputs();
        await AsyncStorage.clear();
      }
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      const message = data?.message || "탈퇴 처리에 실패했습니다.";
      if (status === 409) {
        Alert.alert("탈퇴 불가", message);
      } else if (status === 400 || status === 401) {
        setWithdrawPwError(data?.message || "비밀번호가 일치하지 않습니다.");
      } else {
        Alert.alert("알림", message);
      }
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header notificationCount={notificationCount} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 알바생 프로필 요약 (users/me API) */}
        {profileLoading ? (
          <View style={[styles.sectionContainer, { alignItems: "center", paddingVertical: 32 }]}>
            <ActivityIndicator size="large" color="#9747FF" />
            <Text style={{ marginTop: 12, fontSize: 14, color: "#AFAFAF" }}>
              프로필 불러오는 중...
            </Text>
          </View>
        ) : profileError ? (
          <View style={[styles.sectionContainer, { alignItems: "center", paddingVertical: 24 }]}>
            <Text style={{ fontSize: 14, color: "#999", textAlign: "center" }}>
              {profileError}
            </Text>
          </View>
        ) : profileData ? (
          <StaffProfile data={profileData} />
        ) : null}

        {/* 계정 정보 섹션 */}
        <View style={styles.sectionContainer}>
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
        </View>

        {/* 근무 정보 섹션 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>근무 정보</Text>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push("/staff/Contract")}
          >
            <Text style={styles.menuText}>근로계약서</Text>
            <Ionicons name="chevron-forward" size={18} color="#AFAFAF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Footer />

      {/* --- 모달 모음 --- */}

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
                      placeholder="현재 비밀번호를 입력해 주세요"
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
                    {/* ✅ 글자가 있을 때만 눈 아이콘 표시 */}
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
                    {/* ✅ 글자가 있을 때만 눈 아이콘 표시 */}
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
                    (!canSave || passwordLoading) &&
                      modalStyles.saveBtnDisabled,
                  ]}
                  onPress={handleSavePassword}
                  disabled={!canSave || passwordLoading}
                >
                  <Text
                    style={[
                      modalStyles.saveBtnText,
                      {
                        color:
                          canSave && !passwordLoading ? "#9747FF" : "#AFAFAF",
                      },
                    ]}
                  >
                    {passwordLoading ? "처리 중..." : "저장"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 2. 비밀번호 변경 완료 모달 (재로그인 유도) */}
      <Modal visible={isSuccessModalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View
            style={[
              modalStyles.modalContainer,
              { alignItems: "center", paddingVertical: 40 },
            ]}
          >
            <View style={modalStyles.doorCircle}>
              <Image
                source={require("../../../assets/images/check.png")}
                style={{ width: 65, height: 65 }}
                resizeMode="contain"
              />
            </View>
            <Text style={modalStyles.successTitle}>변경 완료</Text>
            <Text style={modalStyles.successDesc}>
              비밀번호가 안전하게 변경되었습니다.{"\n"}보안을 위해 다시 로그인해
              주세요.
            </Text>
            <TouchableOpacity
              style={modalStyles.confirmBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                clearTokenAndRedirectToLogin();
              }}
            >
              <Text style={modalStyles.confirmBtnText}>확인</Text>
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
                  작성된 전자 근로계약서 열람이{" "}
                  <Text style={{ color: "#FF383C", fontWeight: "bold" }}>
                    불가능
                  </Text>
                  하니 탈퇴 전 미리 저장하세요.
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
                  {/* ✅ 글자가 있을 때만 눈 아이콘 표시 */}
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
                    (!(withdrawPassword && isAgreed) || withdrawLoading) &&
                      modalStyles.saveBtnDisabled,
                  ]}
                  onPress={handleWithdrawal}
                  disabled={!(withdrawPassword && isAgreed) || withdrawLoading}
                >
                  <Text
                    style={[
                      modalStyles.saveBtnText,
                      {
                        color:
                          withdrawPassword && isAgreed && !withdrawLoading
                            ? "#9747FF"
                            : "#AFAFAF",
                      },
                    ]}
                  >
                    {withdrawLoading ? "처리 중..." : "탈퇴하기"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 완료 모달들 (Success Modals) - 기존 정렬 유지 */}
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
              <Image
                source={require("../../../assets/images/door.png")}
                style={{ width: 65, height: 65 }}
                resizeMode="contain"
              />
            </View>
            <Text style={modalStyles.successTitle}>탈퇴 완료</Text>
            <Text style={modalStyles.successDesc}>
              {profileData?.name ?? "회원"}님, 이용해 주셔서 감사합니다.
            </Text>
            <TouchableOpacity
              style={modalStyles.confirmBtn}
              onPress={() => {
                setWithdrawSuccessVisible(false);
                clearTokenAndRedirectToLogin();
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
