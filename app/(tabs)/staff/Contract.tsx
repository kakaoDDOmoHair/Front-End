import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

        return {
          id: String(item.contractId),
          name: workerName,
          location: item.storeName || "내 매장",
          status: statusText,
          wage: item.wage,
          isResigned: !isActive,
          fileUrl: item.fileUrl || null,
          workingHours: "주 12시간", // 기본값
          contractPeriod: "2026-01-20 ~ 2027-01-20", // 기본값
          approvedDate: "2026-01-15", // 기본값
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
            <View style={styles.documentPreview}>
              <View style={styles.dashedBox}>
                {selectedContract?.fileUrl ? (
                  <Image
                    source={{ uri: selectedContract.fileUrl }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 10,
                    }}
                    resizeMode="contain"
                    onLoad={() => console.log("✅ 이미지 로드 성공")}
                    onError={(e) =>
                      console.log("❌ 이미지 로드 실패:", e.nativeEvent.error)
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
