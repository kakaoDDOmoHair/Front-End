import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
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
import api from "../../../constants/api";
import { useNotificationCount } from "../../../hooks/useNotificationCount";
import { styles } from "../../../styles/tabs/boss/Contract";

// ✅ 데이터 모델 정의
export interface ContractData {
  id: string;
  name: string;
  location: string;
  status: string; // ACTIVE, DRAFT, ENDED
  wage: number;
  isResigned: boolean;
  fileUrl?: string; // 서버 이미지/PDF 경로 (다운로드용)
}

// 알바생 정보 인터페이스
interface StaffMember {
  userId: number;
  name: string;
}

const BossContract: React.FC<{
  data: ContractData;
  onAction: (id: string) => void; // 삭제 또는 종료 액션
  onView: (data: ContractData) => void;
}> = ({ data, onAction, onView }) => {
  const isActive = !data.isResigned;
  const buttonText = isActive ? "계약 종료" : "삭제";
  const alertTitle = isActive ? "계약 종료" : "영구 삭제";
  const alertMessage = isActive
    ? "이 직원을 퇴사자 목록으로 이동하시겠습니까?"
    : "이 데이터를 영구적으로 삭제하시겠습니까?";

  const handlePress = () => {
    Alert.alert(alertTitle, alertMessage, [
      { text: "취소", style: "cancel" },
      {
        text: buttonText,
        style: "destructive",
        onPress: () => onAction(data.id),
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {data.name} ({data.location})
      </Text>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isActive ? "#CB30E0" : "#D3D3D3",
            },
          ]}
        />
        <Text style={styles.statusText}>
          {data.status} | 시급 {data.wage.toLocaleString()}원
        </Text>
      </View>
      <View style={{ height: 10 }} />
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onView(data)}
        >
          <Text style={styles.actionButtonText}>계약서 열람</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handlePress}>
          <Text style={styles.actionButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ContractScreen() {
  const router = useRouter();
  const notificationCount = useNotificationCount("boss");
  const [contracts, setContracts] = useState<ContractData[]>([]);
  const [storeId, setStoreId] = useState<number | null>(null);

  // 업로드 모달 상태
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  // 알바생 선택 상태
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showStaffPicker, setShowStaffPicker] = useState(false);

  // 열람 모달 상태
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(
    null,
  );
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const sid = await AsyncStorage.getItem("storeId");

        if (!sid) {
          Alert.alert("알림", "매장 정보가 없습니다. 다시 로그인해 주세요.");
          return;
        }

        const parsedStoreId = Number(sid);

        if (!Number.isFinite(parsedStoreId)) {
          Alert.alert(
            "알림",
            "매장 정보가 올바르지 않습니다. 다시 로그인해 주세요.",
          );
          return;
        }

        setStoreId(parsedStoreId);
        await fetchContracts(parsedStoreId);
        await fetchStaffList(parsedStoreId);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  // 📡 계약서 목록 조회 API
  const fetchContracts = async (currentStoreId: number) => {
    try {
      const response = await api.get("/api/v1/contracts", {
        params: { storeId: currentStoreId, size: 100 },
      });

      console.log("📡 계약서 목록 API 응답:", response.data);

      const content = response.data.content || [];

      const mappedData: ContractData[] = content.map((item: any) => {
        const isActive = item.status === "ACTIVE" || item.status === "DRAFT";

        let statusText = "해지됨";
        if (item.status === "ACTIVE") statusText = "계약 중";
        if (item.status === "DRAFT") statusText = "계약 중";
        if (item.status === "ENDED") statusText = "계약 종료";

        // API 응답에서 실제 이름 사용
        const workerName = item.userName || item.workerName || item.name || "알바생";

        return {
          id: String(item.contractId),
          name: workerName,
          location: item.storeName || "내 매장",
          status: statusText,
          wage: item.wage,
          isResigned: !isActive,
          fileUrl: item.fileUrl || null,
        };
      });

      setContracts(mappedData.sort((a, b) => Number(b.id) - Number(a.id)));
    } catch (error) {
      console.error("계약서 목록 로드 실패:", error);
    }
  };

  // 📡 알바생 목록 조회 API
  const fetchStaffList = async (currentStoreId: number) => {
    try {
      console.log(
        `📡 알바생 목록 요청: /api/v1/stores/${currentStoreId}/workers`,
      );
      const response = await api.get(
        `/api/v1/stores/${currentStoreId}/workers`,
      );

      console.log("📡 알바생 목록 API 응답:", response.data);

      // 응답이 배열 그대로 반환됨
      const workers = Array.isArray(response.data) ? response.data : [];

      const staffMembers: StaffMember[] = workers.map((w: any) => ({
        userId: w.userId,
        name: w.name,
      }));

      setStaffList(staffMembers);
      console.log("📋 알바생 목록:", staffMembers);
    } catch (error: any) {
      console.error("❌ 알바생 목록 로드 실패:", error);
      console.error("❌ 에러 상세:", error.response?.data);
      setStaffList([]);
    }
  };

  const activeContracts = contracts.filter((c) => !c.isResigned);
  const resignedContracts = contracts.filter((c) => c.isResigned);

  // --- 이미지 선택 ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("알림", "권한이 필요합니다.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setRotation(0);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return Alert.alert("알림", "권한이 필요합니다.");
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setRotation(0);
    }
  };

  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // 📡 계약서 등록 - /api/v1/contracts/scan API 호출
  const handleUpload = async () => {
    if (!selectedImage) return Alert.alert("알림", "이미지를 선택해주세요.");
    if (!selectedStaff)
      return Alert.alert("알림", "계약서를 등록할 알바생을 선택해주세요.");
    if (!storeId)
      return Alert.alert(
        "알림",
        "매장 정보를 불러오지 못했습니다. 다시 로그인해 주세요.",
      );

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: selectedImage,
        type: "image/jpeg",
        name: "contract.jpg",
      } as any);
      formData.append("storeId", String(storeId));
      formData.append("userId", String(selectedStaff.userId));

      const response = await api.post("/api/v1/contracts/scan", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("📡 /api/v1/contracts/scan API 응답:", response.data);

      await fetchContracts(storeId);

      setIsAnalyzing(false);
      setIsScanning(false);
      setSelectedImage(null);
      setSelectedStaff(null);
      setShowStaffPicker(false);
      Alert.alert("성공", "계약서가 등록되었습니다.");
    } catch (error) {
      console.error("❌ 계약서 등록 실패:", error);
      setIsAnalyzing(false);
      Alert.alert("오류", "계약서 등록에 실패했습니다.");
    }
  };

  // 📡 계약 종료 (Active -> Resigned 이동)
  const handleTerminateContract = async (contractId: string) => {
    if (contractId.startsWith("fake-")) {
      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId
            ? { ...c, status: "계약 종료", isResigned: true }
            : c,
        ),
      );
      Alert.alert("알림", "계약이 종료되어 퇴사자 목록으로 이동되었습니다.");
      return;
    }

    try {
      await api.patch(`/api/v1/contracts/${contractId}`, {
        status: "ENDED",
      });

      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId
            ? { ...c, status: "계약 종료", isResigned: true }
            : c,
        ),
      );

      Alert.alert("알림", "계약이 종료되어 퇴사자 목록으로 이동되었습니다.");

      if (storeId) fetchContracts(storeId);
    } catch (error) {
      console.error("종료 실패:", error);
      Alert.alert("오류", "상태 변경에 실패했습니다.");
    }
  };

  // 📡 영구 삭제 (Resigned -> 삭제)
  const handlePermanentDelete = async (contractId: string) => {
    if (contractId.startsWith("fake-")) {
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      Alert.alert("알림", "데이터가 영구 삭제되었습니다.");
      return;
    }

    try {
      await api.delete(`/api/v1/contracts/${contractId}`);

      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      Alert.alert("알림", "데이터가 영구 삭제되었습니다.");
    } catch (error) {
      console.error("삭제 실패:", error);
      Alert.alert("오류", "삭제에 실패했습니다.");
    }
  };

  // 📡 상세 열람: 이미지 미리보기
  const handleViewContract = (data: ContractData) => {
    console.log("📋 열람 요청:", data);
    console.log("📋 fileUrl:", data.fileUrl);

    if (!data.fileUrl) {
      Alert.alert("안내", "등록된 계약서 이미지가 없습니다.");
      return;
    }

    setSelectedContract(data);
    setViewModalVisible(true);
  };

  // 📡 다운로드 (이미지 브라우저에서 열기)
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
    } catch (error: any) {
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
          <Text style={styles.sectionTitle}>신규 계약 준비</Text>
          {storeId ? (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setIsScanning(true)}
            >
              <Text style={styles.uploadButtonText}>계약서 사진 업로드</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: "#ccc" }]}
              onPress={() =>
                Alert.alert(
                  "매장 등록 필요",
                  "계약서를 등록하려면 먼저 매장을 등록해주세요.",
                  [
                    { text: "취소", style: "cancel" },
                    {
                      text: "매장 등록하기",
                      onPress: () => router.push("./Store"),
                    },
                  ],
                )
              }
            >
              <Text style={styles.uploadButtonText}>
                매장을 먼저 등록해주세요
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관리 리스트 (계약 중)</Text>
          {activeContracts.length > 0 ? (
            activeContracts.map((item) => (
              <BossContract
                key={item.id}
                data={item}
                onAction={handleTerminateContract}
                onView={handleViewContract}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              현재 관리 중인 직원이 없습니다.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>퇴사자 내역</Text>
          {resignedContracts.length > 0 ? (
            resignedContracts.map((item) => (
              <BossContract
                key={item.id}
                data={item}
                onAction={handlePermanentDelete}
                onView={handleViewContract}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              보관 중인 퇴사자 데이터가 없습니다.
            </Text>
          )}
        </View>
      </ScrollView>

      <Footer />

      {/* 모달 1: 등록 */}
      <Modal visible={isScanning} transparent={true} animationType="fade">
        <View style={[styles.modalOverlay, { justifyContent: "center" }]}>
          <View style={styles.scannerContainer}>
            <Text style={styles.scannerTitle}>계약서 등록</Text>

            {/* 알바생 선택 영역 */}
            {!isAnalyzing && (
              <View style={{ marginBottom: 15, paddingHorizontal: 10 }}>
                <Text style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                  알바생 선택
                </Text>
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: selectedStaff ? "#9747FF" : "#ddd",
                    borderRadius: showStaffPicker ? 0 : 10,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    padding: 12,
                    backgroundColor: "#fff",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                  onPress={() => setShowStaffPicker(!showStaffPicker)}
                >
                  <Text
                    style={{
                      color: selectedStaff ? "#333" : "#999",
                      fontSize: 15,
                    }}
                  >
                    {selectedStaff ? selectedStaff.name : "알바생을 선택하세요"}
                  </Text>
                  <Ionicons
                    name={showStaffPicker ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {/* 펼쳐지는 알바생 목록 */}
                {showStaffPicker && (
                  <View
                    style={{
                      borderWidth: 1,
                      borderTopWidth: 0,
                      borderColor: "#ddd",
                      borderBottomLeftRadius: 10,
                      borderBottomRightRadius: 10,
                      backgroundColor: "#fff",
                      maxHeight: 150,
                    }}
                  >
                    <ScrollView nestedScrollEnabled>
                      {staffList.length > 0 ? (
                        staffList.map((item) => (
                          <TouchableOpacity
                            key={String(item.userId)}
                            style={{
                              padding: 12,
                              borderBottomWidth: 1,
                              borderBottomColor: "#eee",
                              backgroundColor:
                                selectedStaff?.userId === item.userId
                                  ? "#f0e6ff"
                                  : "#fff",
                            }}
                            onPress={() => {
                              setSelectedStaff(item);
                              setShowStaffPicker(false);
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 15,
                                color:
                                  selectedStaff?.userId === item.userId
                                    ? "#9747FF"
                                    : "#333",
                              }}
                            >
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={{ padding: 15, alignItems: "center" }}>
                          <Text style={{ color: "#999" }}>
                            등록된 알바생이 없습니다.
                          </Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            <View style={styles.guideContainer}>
              {isAnalyzing ? (
                <View
                  style={{
                    height: 300,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" color="#9747FF" />
                  <Text
                    style={{
                      marginTop: 15,
                      color: "#9747FF",
                      fontWeight: "bold",
                    }}
                  >
                    AI 등록 중...
                  </Text>
                </View>
              ) : (
                <View style={styles.dashedBox}>
                  {selectedImage ? (
                    <Image
                      source={{ uri: selectedImage }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 25,
                        transform: [{ rotate: `${rotation}deg` }],
                      }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.guideText}>
                      계약서 전체가 잘 보이도록 촬영해주세요
                    </Text>
                  )}
                </View>
              )}
              {!isAnalyzing && (
                <View style={styles.scanControlRow}>
                  <TouchableOpacity
                    style={styles.scanControlBtn}
                    onPress={pickImage}
                  >
                    <Text style={styles.controlIcon}>🖼️ 갤러리</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.scanControlBtn}
                    onPress={takePhoto}
                  >
                    <Text style={styles.controlIcon}>📷 촬영</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.scanControlBtn}
                    onPress={handleRotate}
                    disabled={!selectedImage}
                  >
                    <Text style={styles.controlIcon}>🔄 회전</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setIsScanning(false);
                  setSelectedImage(null);
                  setSelectedStaff(null);
                  setShowStaffPicker(false);
                }}
                disabled={isAnalyzing}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleUpload}
                disabled={isAnalyzing || !selectedImage}
              >
                <Text style={styles.modalSubmitText}>
                  {isAnalyzing ? "처리 중..." : "등록하기"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 모달 2: 이미지 계약서 열람 */}
      <Modal
        visible={viewModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalOverlay, { justifyContent: "flex-end" }]}>
          <View style={styles.documentContainer}>
            <Text style={styles.modalTitle}>근로계약서</Text>
            <View style={styles.documentPreview}>
              <View style={styles.viewDashedBox}>
                {selectedContract?.fileUrl ? (
                  <Image
                    source={{ uri: selectedContract.fileUrl }}
                    style={{ width: "100%", height: "100%", borderRadius: 10 }}
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
                  setViewModalVisible(false);
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
