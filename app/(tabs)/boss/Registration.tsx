import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import api from "../../../constants/api";

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AddressSearchModal } from "../../../components/common/AddressSearchModal";
import { BankSelectModal } from "../../../components/common/BankSelectModal";
import { CustomDatePicker } from "../../../components/common/CustomDatePicker";
import { CustomInput } from "../../../components/common/CustomInput";
import { FormSection } from "../../../components/common/FormSection";
import { SideButton } from "../../../components/common/SideButton";
import { styles } from "../../../styles/tabs/boss/Registration";

export default function StoreRegistrationScreen() {
  const router = useRouter();

  // 1. 상태 관리
  const [userId, setUserId] = useState<number | null>(null); // 🌟 알바생 페이지처럼 userId 상태 추가
  const [businessNumber, setBusinessNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [businessType, setBusinessType] = useState("일반");
  const [addr, setAddr] = useState("제주특별자치도 제주시 첨단로 242");
  const [detailAddress, setDetailAddress] = useState("");
  const [wifiName, setWifiName] = useState("");
  const detailAddressRef = useRef<TextInput>(null);

  const [salaryType, setSalaryType] = useState("월급");
  const [salaryDate, setSalaryDate] = useState("");

  const [selectedBank, setSelectedBank] = useState({ name: "", code: "" });
  const [accountNumber, setAccountNumber] = useState("");
  const [depositorName, setDepositorName] = useState("");

  const [isVerified, setIsVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [isAccountRegistered, setIsAccountRegistered] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSalaryDatePickerVisible, setIsSalaryDatePickerVisible] =
    useState(false);
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);

  // 🌟 [수정] 1. 내 유저 정보 불러오기 (로그인 세션 유지 확인)
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedId = await AsyncStorage.getItem("userId");
        console.log("📍 [사장님] 로드된 userId:", storedId);
        if (storedId) {
          setUserId(Number(storedId));
        } else {
          Alert.alert("알림", "로그인 정보가 없습니다. 다시 로그인해주세요.");
          router.replace("/(auth)/Login");
        }
      } catch (e) {
        console.error("userId 로드 에러:", e);
      }
    };
    loadUserId();
  }, []);

  const isStep1Complete =
    ownerName !== "" && storeName !== "" && openDate !== "";
  const isStep2Complete = isStep1Complete && addr !== "" && wifiName !== "";

  // 와이파이 불러오기
  const fetchCurrentWifi = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "권한 거부",
          "와이파이 정보를 읽으려면 위치 권한이 필요합니다.",
        );
        return;
      }
      const state = await NetInfo.fetch();
      if (state.type === "wifi" && state.isConnected) {
        const ssid =
          state.details && "ssid" in state.details ? state.details.ssid : null;
        if (ssid && ssid !== "unknown") {
          setWifiName(ssid);
          Alert.alert("연결 성공", `현재 연결된 '${ssid}'를 가져왔습니다.`);
        }
      }
    } catch (e) {
      Alert.alert("오류", "와이파이 정보를 불러오지 못했습니다.");
    }
  };

  // 🌟 [수정] 2. 계좌 정보 선등록 (알바생 페이지 로직 적용)
  const handleRegisterAccountInfo = async () => {
    if (!userId) return;
    if (!selectedBank.name || !accountNumber || !depositorName) {
      Alert.alert("알림", "모든 계좌 정보를 입력해주세요.");
      return;
    }

    try {
      console.log("📤 계좌 선등록 시도:", { userId, accountNumber });
      await api.post("/api/v1/auth/test/register", {
        userId: userId,
        bankName: selectedBank.name,
        accountNumber: accountNumber,
        ownerName: depositorName,
      });
      setIsAccountRegistered(true);
      Alert.alert(
        "성공",
        "계좌 정보가 등록되었습니다. 이제 [인증하기]를 눌러주세요.",
      );
    } catch (e: any) {
      console.error("❌ 계좌 등록 실패:", e.response?.data);
      Alert.alert("오류", "이미 등록된 정보이거나 서버 에러가 발생했습니다.");
    }
  };

  // 🌟 [수정] 3. 실명 인증 (등록된 정보를 바탕으로)
  const handleVerifyAccount = async () => {
    if (!isAccountRegistered) {
      Alert.alert("알림", "[등록]을 먼저 완료해주세요.");
      return;
    }

    try {
      console.log("🔍 계좌 인증 시도 (userId: " + userId + ")");
      const response = await api.post("/api/v1/auth/verify-account", {
        userId: userId,
        bankName: selectedBank.name,
        accountNumber: accountNumber,
        ownerName: depositorName,
      });

      const token = response.data?.verificationToken || response.data;
      if (token) {
        setVerificationToken(token);
        setIsVerified(true);
        Alert.alert("성공", "계좌 실명 인증이 완료되었습니다.");
      }
    } catch (error: any) {
      console.error("❌ 인증 에러:", error.response?.data);
      Alert.alert("인증 실패", "서버가 인증 요청을 거부했습니다.");
      setIsVerified(false);
    }
  };

  const fetchStoreDetail = async (storeId: number) => {
    try {
      const response = await api.get(`/api/v1/stores/${storeId}`);
      if (response.status === 200) console.log("매장 상세 동기화 완료");
    } catch (error: any) {
      console.error("매장 조회 실패:", error.response?.data);
    }
  };

  const fetchDashboardStats = async (storeId: number) => {
    try {
      await api.get("/api/v1/stores/dashboard", {
        params: { storeId, year: 2026, month: 1 },
      });
      console.log("통계 데이터 초기화 완료");
    } catch (error: any) {
      console.error("통계 조회 실패:", error.response?.data);
    }
  };

  // 🌟 [수정] 4. 최종 제출 (안전한 에러 파싱 및 리다이렉트)
  const handleSubmit = async () => {
    if (!isVerified) {
      Alert.alert("알림", "계좌 인증을 완료해주세요.");
      return;
    }

    const formattedOpenDate = openDate.replace(/\./g, "-");
    const payDayNumber = salaryDate ? parseInt(salaryDate.split("-")[2]) : 10;

    const requestBody = {
      userId: userId,
      businessNumber,
      ownerName,
      storeName,
      category: "FOOD", // 예시 카테고리
      address: addr,
      detailAddress,
      openingDate: formattedOpenDate,
      storePhone: "064-123-4567",
      wifiInfo: wifiName || "Jeju_Wifi",
      payDay: payDayNumber,
      payRule: salaryType === "월급" ? "MONTHLY" : "WEEKLY",
      bankName: selectedBank.name,
      accountNumber,
      inviteCode: "WELCOME2",
      taxType: businessType === "일반" ? "GENERAL" : "SIMPLE",
      verificationToken,
    };

    try {
      const response = await api.post("/api/v1/stores", requestBody);
      if (response.status === 200 || response.status === 201) {
        const newStoreId = response.data.storeId || 1;

        await AsyncStorage.setItem("storeId", String(newStoreId));
        await fetchStoreDetail(newStoreId);
        await fetchDashboardStats(newStoreId);

        Alert.alert("성공", "매장 등록이 완료되었습니다!", [
          {
            text: "확인",
            onPress: () => router.replace("/(tabs)/boss/Dashboard"),
          },
        ]);
      }
    } catch (error: any) {
      console.log("❌ 등록 에러:", error.response?.data);
      const status = error.response?.status;
      if (status === 409 || status === 500) {
        Alert.alert(
          "알림",
          "이미 등록된 매장이거나 처리 중 오류가 발생했습니다. 대시보드로 이동합니다.",
          [
            {
              text: "이동하기",
              onPress: () => router.replace("/(tabs)/boss/Dashboard"),
            },
          ],
        );
      } else {
        Alert.alert("등록 실패", error.response?.data?.message || "서버 오류");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
        />
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/boss/Notification")}
        >
          <Ionicons name="notifications-outline" size={24} color="#D1C4E9" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <FormSection title="기본 정보">
          <Text style={styles.label}>사업자 번호</Text>
          <CustomInput
            placeholder="사업자 번호"
            value={businessNumber}
            onChangeText={setBusinessNumber}
            keyboardType="number-pad"
          />
          <Text style={styles.label}>대표자 성명</Text>
          <CustomInput
            placeholder="성명"
            value={ownerName}
            onChangeText={setOwnerName}
          />
          <Text style={styles.label}>매장명</Text>
          <CustomInput
            placeholder="매장명"
            value={storeName}
            onChangeText={setStoreName}
          />
          <Text style={styles.label}>개업 연월일</Text>
          <TouchableOpacity onPress={() => setIsDatePickerVisible(true)}>
            <View style={{ pointerEvents: "none" }}>
              <CustomInput
                placeholder="YYYY-MM-DD"
                value={openDate}
                icon="calendar-outline"
                editable={false}
              />
            </View>
          </TouchableOpacity>
        </FormSection>

        <View
          style={{ opacity: isStep1Complete ? 1 : 0.4 }}
          pointerEvents={isStep1Complete ? "auto" : "none"}
        >
          <FormSection title="매장 정보">
            <View style={styles.rowInput}>
              <View style={{ flex: 1 }}>
                <CustomInput placeholder="주소" value={addr} editable={false} />
              </View>
              <SideButton
                title="검색"
                onPress={() => setIsModalVisible(true)}
              />
            </View>
            <CustomInput
              ref={detailAddressRef}
              placeholder="상세주소"
              value={detailAddress}
              onChangeText={setDetailAddress}
            />
            <Text style={styles.label}>매장 Wifi</Text>
            <View style={styles.rowInput}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  placeholder="와이파이"
                  value={wifiName}
                  onChangeText={setWifiName}
                />
              </View>
              <SideButton title="불러오기" onPress={fetchCurrentWifi} />
            </View>
          </FormSection>
        </View>

        <View
          style={{ opacity: isStep2Complete ? 1 : 0.4 }}
          pointerEvents={isStep2Complete ? "auto" : "none"}
        >
          <FormSection title="은행 정보">
            <Text style={styles.label}>급여 정산일</Text>
            <TouchableOpacity
              onPress={() => setIsSalaryDatePickerVisible(true)}
            >
              <View style={{ pointerEvents: "none" }}>
                <CustomInput
                  placeholder="날짜 선택"
                  value={salaryDate}
                  icon="calendar-outline"
                  editable={false}
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.label}>계좌 정보</Text>
            <TouchableOpacity
              onPress={() => !isVerified && setIsBankModalVisible(true)}
            >
              <View style={{ pointerEvents: "none" }}>
                <CustomInput
                  placeholder="은행 선택"
                  value={selectedBank.name}
                  icon="chevron-down-outline"
                  editable={false}
                />
              </View>
            </TouchableOpacity>
            <CustomInput
              placeholder="계좌번호"
              value={accountNumber}
              onChangeText={(t) => {
                setAccountNumber(t);
                setIsVerified(false);
                setIsAccountRegistered(false);
              }}
              keyboardType="number-pad"
              editable={!isVerified}
            />
            <View style={styles.rowInput}>
              <View style={{ flex: 1.5 }}>
                <CustomInput
                  placeholder="예금주명"
                  value={depositorName}
                  onChangeText={(t) => {
                    setDepositorName(t);
                    setIsVerified(false);
                    setIsAccountRegistered(false);
                  }}
                  editable={!isVerified}
                />
              </View>
              {/* 🌟 버튼 순서: 등록 -> 인증 */}
              <SideButton
                title={isAccountRegistered ? "등록됨" : "등록"}
                onPress={handleRegisterAccountInfo}
                style={{
                  backgroundColor: isAccountRegistered ? "#E0E0E0" : "#6C5CE7",
                  marginLeft: 8,
                  flex: 1,
                }}
              />
              <SideButton
                title={isVerified ? "인증됨" : "인증하기"}
                onPress={handleVerifyAccount}
                style={{
                  backgroundColor: isVerified ? "#CCC" : "#6C5CE7",
                  marginLeft: 8,
                  flex: 1,
                }}
              />
            </View>
          </FormSection>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            !isVerified && { backgroundColor: "#CCC" },
          ]}
          onPress={handleSubmit}
          disabled={!isVerified}
        >
          <Text style={styles.submitButtonText}>매장 등록하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddressSearchModal
        visible={isModalVisible}
        onSelect={(d: any) => {
          setAddr(d.address || d);
          setIsModalVisible(false);
        }}
        onClose={() => setIsModalVisible(false)}
      />
      <BankSelectModal
        visible={isBankModalVisible}
        onSelect={(b) => {
          setSelectedBank(b);
          setIsBankModalVisible(false);
        }}
        onClose={() => setIsBankModalVisible(false)}
      />
      <CustomDatePicker
        visible={isDatePickerVisible}
        value={openDate}
        onDateChange={(d) => {
          setOpenDate(d);
          setIsDatePickerVisible(false);
        }}
        onClose={() => setIsDatePickerVisible(false)}
      />
      <CustomDatePicker
        visible={isSalaryDatePickerVisible}
        value={salaryDate}
        onDateChange={(d) => {
          setSalaryDate(d);
          setIsSalaryDatePickerVisible(false);
        }}
        onClose={() => setIsSalaryDatePickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
