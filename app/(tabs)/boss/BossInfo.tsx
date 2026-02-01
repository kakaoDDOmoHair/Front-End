import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import api from "../../../constants/api";
import { useNotificationCount } from "../../../hooks/useNotificationCount";
import { styles } from "../../../styles/tabs/boss/BossInfo";

// 📋 API 응답 데이터 타입 정의
interface StoreDetail {
  storeName: string;
  businessNumber: string;
  ownerName: string;
  category: string;
  address: string;
  detailAddress: string;
  openingDate: string;
  storePhone: string;
  wifiInfo: string;
  payDay: number;
  payRule: string;
  bankName: string;
  accountNumber: string;
}

const InfoItem = ({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) => (
  <View style={[styles.itemRow, isLast && styles.lastItem]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueContainer}>
      <Text style={styles.valueText}>{value || "미등록"}</Text>
    </View>
  </View>
);

const InfoSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.infoCard}>{children}</View>
  </View>
);

export default function BossInfoPage() {
  const router = useRouter();
  const notificationCount = useNotificationCount("boss");

  const [storeInfo, setStoreInfo] = useState<StoreDetail | null>(null);
  const [ownerName, setOwnerName] = useState("사장님");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);

        // 1. AsyncStorage에서 username 가져오기
        const username = await AsyncStorage.getItem("username");
        if (username) setOwnerName(username);

        // 2. storeId 확보 시도 (스토리지 -> 없으면 서버 확인)
        let storeId = await AsyncStorage.getItem("storeId");

        // 🔥 [안전장치] 스토리지에 storeId가 없으면 users/me를 찔러서 가져옴
        if (!storeId && username) {
          console.log("⚠️ 스토리지에 storeId 없음. 서버에서 재조회 시도...");
          try {
            const userRes = await api.get("/api/v1/users/me", {
              params: { username },
            });
            if (userRes.data?.storeId) {
              storeId = String(userRes.data.storeId);
              // 찾았으면 다음에 쓰게 저장
              await AsyncStorage.setItem("storeId", storeId);
              console.log("✅ 서버에서 storeId 복구 완료:", storeId);
            }
          } catch (err) {
            console.error("유저 정보 재조회 실패:", err);
          }
        }

        // 3. storeId가 여전히 없으면 '등록된 매장 없음' 화면 표시
        if (!storeId || storeId === "null" || storeId === "undefined") {
          console.log("❌ 최종적으로 storeId를 찾을 수 없음.");
          setStoreInfo(null);
          setLoading(false);
          return;
        }

        // 4. 매장 상세 정보 API 호출
        console.log(`📡 매장 상세 정보 요청: /api/v1/stores/${storeId}`);
        const response = await api.get(`/api/v1/stores/${storeId}`);

        console.log("📥 API 응답 데이터:", response.data);

        // 🔥 [데이터 구조 처리] data.data 로 들어오는 경우와 그냥 data로 들어오는 경우 모두 대응
        const actualData = response.data.data || response.data;

        if (actualData) {
          setStoreInfo(actualData);
        } else {
          Alert.alert("오류", "매장 정보를 불러왔으나 데이터가 비어있습니다.");
        }
      } catch (error: any) {
        console.error("❌ 매장 정보 로드 실패 상세:", error);
        if (error.response) {
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
        }

        if (error.response?.status === 404) {
          setStoreInfo(null);
        } else {
          Alert.alert("오류", "서버 연결에 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, []);

  // 로딩 화면
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header notificationCount={notificationCount} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={{ marginTop: 10, color: "#AFAFAF" }}>
            정보를 불러오는 중입니다...
          </Text>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  // 매장 정보 없음 (등록 유도)
  if (!storeInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <Header notificationCount={notificationCount} />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Ionicons
            name="storefront-outline"
            size={60}
            color="#ddd"
            style={{ marginBottom: 20 }}
          />
          <Text style={{ color: "#666", marginBottom: 20, fontSize: 16 }}>
            등록된 매장 정보가 없습니다.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#E0D5FF",
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
            }}
            onPress={() => router.push("/(tabs)/boss/Registration")}
          >
            <Text style={{ color: "#6C5CE7", fontWeight: "bold" }}>
              매장 등록하러 가기
            </Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header notificationCount={notificationCount} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSummary}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={45} color="#FFFFFF" />
          </View>
          <View style={styles.profileText}>
            {/* null check를 추가하여 안전하게 렌더링 */}
            <Text style={styles.nameText}>
              {storeInfo?.ownerName || ownerName} 사장님
            </Text>
            <Text style={styles.shopText}>{storeInfo?.storeName}</Text>
          </View>
        </View>

        <InfoSection title="기본 정보">
          <InfoItem label="사업자 번호" value={storeInfo.businessNumber} />
          <InfoItem label="개업 연월일" value={storeInfo.openingDate} />
          <InfoItem label="업태/업종" value={storeInfo.category} isLast />
        </InfoSection>

        <InfoSection title="운영 정보">
          <InfoItem
            label="매장 주소"
            value={`${storeInfo.address} ${storeInfo.detailAddress || ""}`}
          />
          <InfoItem label="매장 전화번호" value={storeInfo.storePhone} />
          <InfoItem label="매장 WIFI" value={storeInfo.wifiInfo} isLast />
        </InfoSection>

        <InfoSection title="정산 정보">
          <InfoItem
            label="급여 정산일"
            value={storeInfo.payDay ? `매월 ${storeInfo.payDay}일` : "미설정"}
          />
          <InfoItem
            label="정산 계좌정보"
            value={`${storeInfo.bankName || ""} ${storeInfo.accountNumber || ""}`}
            isLast
          />
        </InfoSection>
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
}
