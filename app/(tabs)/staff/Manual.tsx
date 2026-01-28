import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, View } from "react-native";

import { ManualItem } from "../../../components/manual/StaffData";
import { StaffManual } from "../../../components/manual/StaffManual";
import api from "../../../constants/api";

export default function ManualScreen() {
  const [selectedManual, setSelectedManual] = useState<ManualItem | null>(null);
  const [manualList, setManualList] = useState<ManualItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. 공통 인증 데이터 가져오기
  const getAuthData = async (key: string) => {
    if (Platform.OS === "web") return localStorage.getItem(key);
    const secureData = await SecureStore.getItemAsync(key);
    return secureData || (await AsyncStorage.getItem(key));
  };

  const getAuthToken = async () => await getAuthData("user_token");
  const getUsername = async () => await getAuthData("username");

  // 🌟 2. 텍스트(content)를 스텝(steps)으로 변환하는 파싱 함수
  // Boss 앱과 동일한 로직: [제목]\n내용 -> { title, descriptions }
  const parseContentToSteps = (content: string) => {
    if (!content) return [];

    const rawBlocks = content.split(/\n\s*\n/);

    return rawBlocks.map((block, index) => {
      // 정규식으로 [제목] 과 내용 분리
      const match = block.match(/^\[(.*?)\]\s*\n([\s\S]*)$/);

      if (match) {
        return {
          stepNumber: index + 1,
          title: match[1], // 괄호 안 (예: 청소)
          descriptions: [match[2].trim()], // 나머지 내용
        };
      } else {
        // 형식이 안 맞으면 통째로 내용으로
        return {
          stepNumber: index + 1,
          title: "상세 내용",
          descriptions: [block.trim()],
        };
      }
    });
  };

  // 3. 매뉴얼 목록 조회
  const fetchManuals = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const username = await getUsername();

      if (!token || !username) {
        Alert.alert("알림", "로그인 정보가 없습니다.");
        return;
      }

      // 내 정보에서 매장 ID 확인
      const userRes = await api.get("/api/v1/users/me", {
        params: { username },
        headers: { Authorization: `Bearer ${token}` },
      });

      const storeId = userRes.data.data?.storeId || userRes.data.storeId;

      if (!storeId) {
        Alert.alert("알림", "연결된 근무지(매장) 정보가 없습니다.");
        return;
      }

      // 목록 API 호출
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

      // 목록 데이터 매핑
      const formattedData = rawData.map((item: any) => ({
        ...item,
        category: categoryMap[item.category] || item.category,
        manualId: item.manualId || item.id,
      }));

      setManualList(formattedData);
    } catch (error) {
      console.error("Staff 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🌟 4. 상세 조회 (클릭 시 content 가져와서 파싱)
  const handleSelectManual = async (item: ManualItem | null) => {
    // 닫기(null) 처리
    if (!item) {
      setSelectedManual(null);
      return;
    }

    try {
      setLoading(true);
      const token = await getAuthToken();

      console.log(`📡 Staff 상세 조회 요청 ID: ${item.manualId}`);

      // 상세 내용 요청 (content 포함됨)
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

        // 서버의 content 필드 확인
        const rawContent = detail.content || detail.context || "";

        // steps 배열이 비어있다면 content를 파싱해서 채워넣기
        let parsedSteps = detail.steps || [];
        if ((!parsedSteps || parsedSteps.length === 0) && rawContent) {
          parsedSteps = parseContentToSteps(rawContent);
        }

        const fullDetail: ManualItem = {
          manualId: detail.id || detail.manualId,
          title: detail.title,
          category: categoryMap[detail.category] || detail.category,
          content: rawContent,
          steps: parsedSteps, // 👈 파싱된 스텝 데이터가 여기에 들어갑니다.
        };

        console.log("✅ Staff 상세 데이터 로드 완료:", fullDetail.title);
        setSelectedManual(fullDetail);
      }
    } catch (error) {
      console.error("상세 조회 에러:", error);
      Alert.alert("오류", "상세 내용을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchManuals();
  }, [fetchManuals]);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {loading ? (
        <ActivityIndicator size="large" color="#E0D5FF" style={{ flex: 1 }} />
      ) : (
        <StaffManual
          manualList={manualList} // API로 가져온 리스트
          selectedManual={selectedManual} // 상세 내용 (파싱됨)
          onSelect={handleSelectManual} // 상세 조회 함수 연결
        />
      )}
    </View>
  );
}
