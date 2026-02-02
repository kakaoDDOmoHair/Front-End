import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { ContractData } from "../../../components/contract/ContractData";
import { StaffContract } from "../../../components/contract/StaffContract";
import api from "../../../constants/api";
import { useNotificationCount } from "../../../hooks/useNotificationCount";
import { styles } from "../../../styles/tabs/staff/Contract";

// 서버에서 반환하는 localhost URL을 실제 서버 URL로 변환
const BASE_URL = "https://queenliest-profamily-jarrett.ngrok-free.dev";
const convertFileUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  console.log("🔗 원본 fileUrl:", url);

  let convertedUrl = url;

  // 10.0.2.2:8080 (Android 에뮬레이터 localhost) → 실제 서버 URL로 변환
  if (url.includes("10.0.2.2:8080")) {
    convertedUrl = url.replace("http://10.0.2.2:8080", BASE_URL);
  }
  // localhost:8080 → 실제 서버 URL로 변환
  else if (url.includes("localhost:8080")) {
    convertedUrl = url.replace("http://localhost:8080", BASE_URL);
  }
  // 127.0.0.1:8080 → 실제 서버 URL로 변환
  else if (url.includes("127.0.0.1:8080")) {
    convertedUrl = url.replace("http://127.0.0.1:8080", BASE_URL);
  }

  console.log("🔗 변환된 fileUrl:", convertedUrl);
  return convertedUrl;
};

export default function StaffContractScreen() {
  const router = useRouter();
  const notificationCount = useNotificationCount("staff");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(
    null,
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const sid = await AsyncStorage.getItem("storeId");
        const username = await AsyncStorage.getItem("username");

        if (sid) {
          const parsedStoreId = Number(sid);
          // 사용자 이름 가져오기
          let myName = "";
          if (username) {
            try {
              const meRes = await api.get("/api/v1/users/me", {
                params: { username },
              });
              myName = meRes.data?.name || meRes.data?.data?.name || "";
            } catch (e) {
              console.error("사용자 정보 조회 실패:", e);
            }
          }
          await fetchContracts(parsedStoreId, myName);
        }
      } catch (e) {
        console.error("초기화 오류:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // 📡 내 계약서 목록 조회 API (알바생 본인 계약서만 조회)
  const fetchContracts = async (currentStoreId: number, myName: string) => {
    try {
      console.log(
        `📡 내 계약서 조회: storeId=${currentStoreId}, myName=${myName}`,
      );

      const response = await api.get("/api/v1/contracts", {
        params: { storeId: currentStoreId, size: 100 },
      });

      console.log("📡 계약서 목록 API 응답:", response.data);

      const content = response.data.content || [];

      // 본인 계약서만 필터링 (workerName이 내 이름과 일치하는 것만)
      const myContent = content.filter((item: any) => {
        return item.workerName === myName;
      });

      console.log(
        `📋 전체 ${content.length}개 중 내 계약서 ${myContent.length}개 (내 이름: ${myName})`,
      );

      const mappedData: ContractData[] = myContent.map((item: any) => {
        const isActive = item.status === "ACTIVE" || item.status === "DRAFT";

        let statusText = "해지됨";
        if (item.status === "ACTIVE") statusText = "계약 중";
        if (item.status === "DRAFT") statusText = "계약 중";
        if (item.status === "ENDED") statusText = "계약 종료";

        // API 응답에서 실제 이름 사용
        const workerName =
          item.userName || item.workerName || item.name || "나";

        // 계약기간 포맷팅 (workPeriod가 "2026-02-01 ~ 2026-12-31" 형태로 올 수 있음)
        let contractPeriod = null;
        if (item.workPeriod && typeof item.workPeriod === "string") {
          contractPeriod = item.workPeriod;
        } else {
          const startDate = item.startDate || item.contractStartDate;
          const endDate = item.endDate || item.contractEndDate;
          contractPeriod =
            startDate && endDate
              ? `${startDate.split("T")[0]} ~ ${endDate.split("T")[0]}`
              : startDate
                ? `${startDate.split("T")[0]} ~`
                : endDate
                  ? `~ ${endDate.split("T")[0]}`
                  : null;
        }

        // 등록일 포맷팅
        const createdAt = item.createdAt || item.registeredAt;
        const approvedDate = createdAt ? createdAt.split("T")[0] : null;

        return {
          id: String(item.contractId),
          name: workerName,
          location: item.storeName || "내 매장",
          status: statusText,
          wage: item.wage,
          isResigned: !isActive,
          fileUrl: convertFileUrl(item.fileUrl),
          workingHours: item.workingHours || null,
          contractPeriod: contractPeriod,
          approvedDate: approvedDate,
        };
      });

      setContracts(mappedData.sort((a, b) => Number(b.id) - Number(a.id)));
    } catch (error) {
      console.error("계약서 목록 로드 실패:", error);
    }
  };

  const myContracts = contracts.filter((c) => !c.isResigned);

  const handleOpenOriginal = (item: ContractData) => {
    if (!item.fileUrl) {
      Alert.alert("안내", "등록된 계약서 이미지가 없습니다.");
      return;
    }
    console.log("📋 열람 요청:", item);
    console.log("📋 이미지 URL:", item.fileUrl);
    setSelectedContract(item);
    setModalVisible(true);
  };

  // 다운로드 (브라우저에서 열기)
  const handleDownloadPdf = async () => {
    const downloadUrl = selectedContract?.fileUrl;

    if (!downloadUrl) {
      Alert.alert("오류", "파일 URL이 없습니다.");
      return;
    }

    try {
      setIsDownloading(true);
      console.log("📥 다운로드 URL:", downloadUrl);
      await Linking.openURL(downloadUrl);
    } catch (error) {
      console.error("📥 다운로드 에러:", error);
      Alert.alert("오류", "다운로드에 실패했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header notificationCount={notificationCount} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>근로계약서</Text>
          {isLoading ? (
            <View style={{ alignItems: "center", padding: 20 }}>
              <ActivityIndicator size="large" color="#9747FF" />
              <Text style={{ marginTop: 10, color: "#666" }}>
                계약서 불러오는 중...
              </Text>
            </View>
          ) : myContracts.length > 0 ? (
            myContracts.map((item) => (
              <StaffContract
                key={item.id}
                data={item}
                onViewOriginal={() => handleOpenOriginal(item)}
              />
            ))
          ) : (
            <View style={{ alignItems: "center", padding: 20 }}>
              <Text
                style={{
                  color: "#666",
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                등록된 계약서가 없습니다.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Footer />

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.documentContainer}>
            <Text style={styles.modalTitle}>계약서 원본</Text>

            {/* 계약 정보 표시 */}
            <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}
              >
                {selectedContract?.name} ({selectedContract?.location})
              </Text>
              {selectedContract?.approvedDate && (
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                  📅 등록일: {selectedContract.approvedDate}
                </Text>
              )}
              {selectedContract?.contractPeriod && (
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                  📋 계약기간: {selectedContract.contractPeriod}
                </Text>
              )}
              <Text style={{ fontSize: 14, color: "#666" }}>
                💰 시급: {selectedContract?.wage?.toLocaleString()}원
              </Text>
            </View>

            <View style={styles.documentPreview}>
              <View style={styles.dashedBox}>
                {selectedContract?.fileUrl ? (
                  <Image
                    source={{
                      uri: selectedContract.fileUrl,
                      headers: {
                        "ngrok-skip-browser-warning": "69420",
                      },
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 10,
                    }}
                    contentFit="contain"
                    onLoad={() =>
                      console.log(
                        "✅ 이미지 로드 성공:",
                        selectedContract.fileUrl,
                      )
                    }
                    onError={(e) =>
                      console.log(
                        "❌ 이미지 로드 실패:",
                        e.error,
                        "URL:",
                        selectedContract.fileUrl,
                      )
                    }
                  />
                ) : (
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={50}
                      color="#9747FF"
                    />
                    <Text style={{ marginTop: 10, color: "#333" }}>
                      계약서 이미지가 없습니다.
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedContract(null);
                }}
              >
                <Text style={styles.closeBtnText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={handleDownloadPdf}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator color="#9747FF" />
                ) : (
                  <Text style={styles.downloadBtnText}>사본 다운로드</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
