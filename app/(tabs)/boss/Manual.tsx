import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, SafeAreaView } from "react-native";

import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { ManualItem } from "../../../components/manual/BossData";
import { BossManual } from "../../../components/manual/BossManual";
import api from "../../../constants/api";
import { useNotificationCount } from "../../../hooks/useNotificationCount";
import { BossManualForm } from "./BossManualForm";

export default function ManualScreen() {
  const notificationCount = useNotificationCount("boss");
  const [selectedManual, setSelectedManual] = useState<ManualItem | null>(null);
  const [manualList, setManualList] = useState<ManualItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getAuthData = async (key: string) => {
    if (Platform.OS === "web") return localStorage.getItem(key);
    const secureData = await SecureStore.getItemAsync(key);
    return secureData || (await AsyncStorage.getItem(key));
  };

  const getAuthToken = async () => await getAuthData("user_token");
  const getUsername = async () => await getAuthData("username");

  const fetchManuals = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const username = await getUsername();

      if (!token || !username) {
        Alert.alert("알림", "로그인 정보가 없습니다.");
        return;
      }

      const userRes = await api.get("/api/v1/users/me", {
        params: { username },
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = userRes.data.data || userRes.data;
      const storeId = userData.storeId;

      if (!storeId) {
        Alert.alert("알림", "연결된 매장 정보가 없습니다.");
        return;
      }

      const response = await api.get("/api/v1/manuals", {
        params: { storeId: String(storeId) },
        headers: { Authorization: `Bearer ${token}` },
      });

      const rawData = response.data.data || [];
      const categoryMap: { [key: string]: string } = {
        OPEN: "오픈",
        CLOSE: "마감",
        PAYMENT: "결제",
        OTHER: "기타",
      };

      const formattedData = rawData.map((item: any) => ({
        ...item,
        category: categoryMap[item.category] || item.category,
        manualId: item.manualId || item.id,
      }));

      setManualList(formattedData);
    } catch (error: any) {
      console.error("목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🌟 [핵심 기능 추가] 문자열을 분석해서 제목과 내용으로 나누는 함수
  const parseContentToSteps = (content: string) => {
    if (!content) return [];

    // 1. 엔터 두 번(\n\n)을 기준으로 여러 스텝을 나눕니다.
    const rawBlocks = content.split(/\n\s*\n/);

    return rawBlocks.map((block, index) => {
      // 2. 정규식으로 "[제목]" 과 "내용"을 분리합니다.
      // ^\[(.*?)\] : 문장 시작이 [로 시작하고 ]로 끝나는 부분을 찾음 (제목)
      // \s*\n([\s\S]*) : 그 뒤에 줄바꿈이 있고 나머지 모든 텍스트 (내용)
      const match = block.match(/^\[(.*?)\]\s*\n([\s\S]*)$/);

      if (match) {
        return {
          stepNumber: index + 1,
          title: match[1], // 괄호 안의 문자 (예: N)
          descriptions: [match[2].trim()], // 나머지 문자 (예: J)
        };
      } else {
        // 형식이 안 맞으면 그냥 통째로 내용에 넣음
        return {
          stepNumber: index + 1,
          title: "상세 내용",
          descriptions: [block.trim()],
        };
      }
    });
  };

  // 상세 조회
  const handleSelectManual = async (item: ManualItem | null) => {
    if (!item) {
      setSelectedManual(null);
      return;
    }

    try {
      setLoading(true);
      const token = await getAuthToken();

      console.log(`📡 상세 조회 요청 ID: ${item.manualId}`);

      const response = await api.get(`/api/v1/manuals/${item.manualId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const detail = response.data.data || response.data;

      if (detail) {
        const categoryMap: { [key: string]: string } = {
          OPEN: "오픈",
          CLOSE: "마감",
          PAYMENT: "결제",
          OTHER: "기타",
        };

        const rawContent = detail.content || detail.content || "";

        // 🌟 [핵심] 서버에는 steps 배열이 비어있어도, content 문자열을 분석해서 채워넣습니다.
        let parsedSteps = detail.steps || [];
        if (parsedSteps.length === 0 && rawContent) {
          parsedSteps = parseContentToSteps(rawContent);
        }

        const fullDetail: ManualItem = {
          manualId: detail.id || detail.manualId,
          title: detail.title,
          content: rawContent,
          category: categoryMap[detail.category] || detail.category || "기타",
          steps: parsedSteps, // 👈 분리된 데이터가 여기 들어갑니다.
        };

        console.log(
          "✅ 데이터 파싱 완료:",
          JSON.stringify(fullDetail.steps, null, 2),
        );
        setSelectedManual(fullDetail);
      }
    } catch (error: any) {
      console.error("상세 조회 에러:", error);
      Alert.alert("오류", "상세 내용을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (manualId: number) => {
    try {
      const token = await getAuthToken();
      await api.delete(`/api/v1/manuals/${manualId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("성공", "삭제되었습니다.");
      setSelectedManual(null);
      fetchManuals();
    } catch (e) {
      Alert.alert("오류", "삭제 실패");
    }
  };

  useEffect(() => {
    fetchManuals();
  }, [fetchManuals]);

  if (isRegistering || isEditing) {
    return (
      <BossManualForm
        mode={isEditing ? "edit" : "register"}
        initialData={isEditing ? selectedManual : null}
        onClose={() => {
          setIsRegistering(false);
          setIsEditing(false);
        }}
        onSave={() => {
          setIsRegistering(false);
          setIsEditing(false);
          fetchManuals();
          if (isEditing && selectedManual) {
            handleSelectManual(selectedManual);
          }
        }}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {!selectedManual && <Header notificationCount={notificationCount} />}
      {loading ? (
        <ActivityIndicator size="large" color="#E0D5FF" style={{ flex: 1 }} />
      ) : (
        <BossManual
          manualList={manualList}
          selectedManual={selectedManual}
          onSelect={handleSelectManual}
          onRegister={() => setIsRegistering(true)}
          onEdit={(item) => {
            setSelectedManual(item);
            setIsEditing(true);
          }}
          onDelete={handleDelete}
        />
      )}
      {!selectedManual && <Footer />}
    </SafeAreaView>
  );
}
