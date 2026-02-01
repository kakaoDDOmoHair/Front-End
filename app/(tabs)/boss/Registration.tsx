import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import api from "../../../constants/api";

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// 공통 컴포넌트 임포트 (매장 등록: 헤더만, 푸터 없음)
import { BankSelectModal } from "../../../components/common/BankSelectModal";
import { CustomDatePicker } from "../../../components/common/CustomDatePicker";
import { CustomInput } from "../../../components/common/CustomInput";
import { FormSection } from "../../../components/common/FormSection";
import Header from "../../../components/common/Header";
import { SideButton } from "../../../components/common/SideButton";
import { useNotificationCount } from "../../../hooks/useNotificationCount";
import { styles } from "../../../styles/tabs/boss/Registration";

// --- 헬퍼 함수: 두 좌표 사이의 거리를 계산 (m 단위) ---
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3; // 지구 반지름
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function StoreRegistrationScreen() {
  const router = useRouter();

  // 1. 상태 관리
  const [userId, setUserId] = useState<number | null>(null);
  const notificationCount = useNotificationCount("boss");
  const [businessNumber, setBusinessNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [openDate, setOpenDate] = useState("");

  const [addr, setAddr] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 33.450701,
    longitude: 126.570667,
  });
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  const [wifiName, setWifiName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [salaryDate, setSalaryDate] = useState("");
  const [selectedBank, setSelectedBank] = useState({ name: "", code: "" });
  const [accountNumber, setAccountNumber] = useState("");
  const [depositorName, setDepositorName] = useState("");

  const [isVerified, setIsVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [isAccountRegistered, setIsAccountRegistered] = useState(false);

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isSalaryDatePickerVisible, setIsSalaryDatePickerVisible] =
    useState(false);
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);

  // 🌟 사장님이 등록한 매장의 실제 정보 (검증용)
  const [registeredStoreInfo, setRegisteredStoreInfo] = useState<{
    lat: number;
    lon: number;
    wifi: string;
  } | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const storedId = await AsyncStorage.getItem("userId");
        if (storedId) setUserId(Number(storedId));

        // 위치 권한 및 현재 위치 로드
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          setSelectedLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }

        // 🌟 기존에 등록된 매장 정보가 있다면 서버에서 가져오는 로직 (예시)
        // const response = await api.get(`/api/v1/stores/user/${storedId}`);
        // if(response.data) setRegisteredStoreInfo({ lat: ..., lon: ..., wifi: ... });
      } catch (e) {
        console.error(e);
      }
    };
    initData();
  }, []);

  // ✅ [수정된 판정 로직] 위치 및 와이파이 일치 여부 확인
  const isAttendanceEnabled = useMemo(() => {
    if (!registeredStoreInfo) return false;

    // 1. 와이파이 일치 여부
    const isWifiMatched = wifiName === registeredStoreInfo.wifi;

    // 2. 거리 계산 (반경 100m 이내)
    const distance = getDistance(
      selectedLocation.latitude,
      selectedLocation.longitude,
      registeredStoreInfo.lat,
      registeredStoreInfo.lon,
    );
    const isLocationMatched = distance <= 100;

    // 와이파이가 일치하거나, 위치가 범위 안일 때 활성화
    return isWifiMatched || isLocationMatched;
  }, [wifiName, selectedLocation, registeredStoreInfo]);

  // 📍 지도 위치 확정 함수
  const handleConfirmLocation = async () => {
    try {
      const reverseGeocoded =
        await Location.reverseGeocodeAsync(selectedLocation);
      if (reverseGeocoded.length > 0) {
        const item = reverseGeocoded[0];
        const fullAddr =
          `${item.region || ""} ${item.city || ""} ${item.street || ""} ${item.streetNumber || ""}`.trim();
        setAddr(fullAddr || "지도에서 선택된 위치");
      }
      setIsMapModalVisible(false);
    } catch (e) {
      Alert.alert("오류", "주소를 불러오지 못했습니다.");
      setIsMapModalVisible(false);
    }
  };

  // 📶 와이파이 불러오기 함수
  const fetchCurrentWifi = async () => {
    try {
      if (Platform.OS === "ios") {
        Alert.alert(
          "iOS 제한",
          "iOS에서는 보안 정책상 현재 와이파이 이름을 가져올 수 없습니다. 설정에서 직접 연결 후 수동 입력해주세요.",
          [
            {
              text: "설정 열기",
              onPress: () => Linking.openSettings(),
            },
            { text: "취소", style: "cancel" },
          ],
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted")
        return Alert.alert("권한 필요", "위치 권한을 허용해 주세요.");

      const state = await NetInfo.refresh();
      const ssid =
        state.details && "ssid" in state.details ? state.details.ssid : null;

      if (ssid && ssid !== "unknown") {
        setWifiName(ssid as string);
        Alert.alert("연결 성공", `'${ssid}' 와이파이가 확인되었습니다.`);
      } else {
        Alert.alert(
          "알림",
          "와이파이 정보를 읽을 수 없습니다. 직접 입력하거나 다시 시도해주세요.",
        );
      }
    } catch (e) {
      Alert.alert("오류", "정보를 읽지 못했습니다.");
    }
  };

  // 💰 계좌 등록 및 인증
  const handleRegisterAccountInfo = async () => {
    if (!userId || !selectedBank.name || !accountNumber || !depositorName)
      return Alert.alert("알림", "정보를 모두 입력하세요.");
    try {
      await api.post("/api/v1/auth/test/register", {
        userId,
        bankName: selectedBank.name,
        accountNumber,
        ownerName: depositorName,
      });
      setIsAccountRegistered(true);
      Alert.alert("성공", "정보 등록 완료!");
    } catch (e) {
      Alert.alert("오류", "실패");
    }
  };

  const handleVerifyAccount = async () => {
    if (!isAccountRegistered) return Alert.alert("알림", "등록을 먼저 하세요.");
    try {
      const response = await api.post("/api/v1/auth/verify-account", {
        userId,
        bankName: selectedBank.name,
        accountNumber,
        ownerName: depositorName,
      });
      const token = response.data?.verificationToken || response.data;
      if (token) {
        setVerificationToken(token);
        setIsVerified(true);
        Alert.alert("성공", "인증 완료!");
      }
    } catch (error) {
      Alert.alert("실패", "다시 시도하세요.");
    }
  };

  const handleSubmit = async () => {
    if (!isVerified) return Alert.alert("알림", "계좌 인증이 필요합니다.");
    try {
      setIsLoading(true);
      const requestBody = {
        userId,
        businessNumber,
        ownerName,
        storeName,
        category: "FOOD",
        address: addr,
        detailAddress,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        openingDate: openDate.replace(/\./g, "-"),
        wifiInfo: wifiName,
        payDay: salaryDate ? parseInt(salaryDate.split("-")[2]) : 10,
        payRule: "MONTHLY",
        bankName: selectedBank.name,
        accountNumber,
        inviteCode: "WELCOME2",
        taxType: "GENERAL",
        verificationToken,
      };

      const response = await api.post("/api/v1/stores", requestBody);
      if (response.status === 200 || response.status === 201) {
        await AsyncStorage.setItem("storeId", String(response.data.storeId));
        Alert.alert("성공", "매장 등록 완료!", [
          {
            text: "확인",
            onPress: () => router.replace("/(tabs)/boss/Dashboard"),
          },
        ]);
      }
    } catch (error) {
      Alert.alert("실패", "서버 통신 오류");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" />
      <Header notificationCount={notificationCount} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 기본 정보 */}
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
              <View pointerEvents="none">
                <CustomInput
                  placeholder="YYYY-MM-DD"
                  value={openDate}
                  icon="calendar-outline"
                  editable={false}
                />
              </View>
            </TouchableOpacity>
          </FormSection>

          {/* 위치 및 Wifi */}
          <FormSection title="매장 위치 & Wifi">
            <View style={styles.rowInput}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  placeholder="지도를 눌러 위치를 선택하세요"
                  value={addr}
                  editable={false}
                />
              </View>
              <SideButton
                title="지도 선택"
                onPress={() => setIsMapModalVisible(true)}
              />
            </View>
            <CustomInput
              placeholder="상세주소(건물명, 층수 등)"
              value={detailAddress}
              onChangeText={setDetailAddress}
            />

            <Text style={styles.label}>매장 Wifi</Text>
            <View style={styles.rowInput}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  placeholder="와이파이 이름"
                  value={wifiName}
                  onChangeText={setWifiName}
                />
              </View>
              <SideButton title="불러오기" onPress={fetchCurrentWifi} />
            </View>
          </FormSection>

          {/* 은행 정보 */}
          <FormSection title="은행 정보">
            <Text style={styles.label}>급여 정산일</Text>
            <TouchableOpacity
              onPress={() => setIsSalaryDatePickerVisible(true)}
            >
              <View pointerEvents="none">
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
              <View pointerEvents="none">
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
                  }}
                  editable={!isVerified}
                />
              </View>
              <SideButton
                title={isAccountRegistered ? "등록됨" : "등록"}
                onPress={handleRegisterAccountInfo}
                style={{
                  backgroundColor: isAccountRegistered ? "#CCC" : "#9747FF",
                  marginLeft: 8,
                  flex: 1,
                }}
              />
              <SideButton
                title={isVerified ? "인증됨" : "인증하기"}
                onPress={handleVerifyAccount}
                style={{
                  backgroundColor: isVerified ? "#CCC" : "#9747FF",
                  marginLeft: 8,
                  flex: 1,
                }}
              />
            </View>
          </FormSection>

          {/* 등록 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isVerified || isLoading) && { backgroundColor: "#CCC" },
            ]}
            onPress={handleSubmit}
            disabled={!isVerified || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>매장 등록하기</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 모달 레이어들 */}
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

      {/* 지도 모달 */}
      <Modal visible={isMapModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View
            style={{
              padding: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              매장 위치 지정
            </Text>
            <TouchableOpacity onPress={() => setIsMapModalVisible(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              ...selectedLocation,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            }}
            onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
          >
            <Marker
              coordinate={selectedLocation}
              title="매장 입구"
              pinColor="#9747FF"
            />
          </MapView>
          <View
            style={{ padding: 20, borderTopWidth: 1, borderTopColor: "#eee" }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "#9747FF",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={handleConfirmLocation}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                이 위치로 설정
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
