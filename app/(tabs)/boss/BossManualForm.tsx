// 상세 목록 페이지
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ManualItem, Step } from "../../../components/manual/BossData";
import { STEP_PLACEHOLDERS } from "../../../components/manual/ManualPlaceholders";
import api from "../../../constants/api";
import { styles } from "../../../styles/tabs/boss/Manual";

interface Props {
  mode?: "register" | "edit";
  initialData?: ManualItem | null;
  onClose: () => void;
  onSave: () => void;
}

export const BossManualForm = ({
  mode = "register",
  initialData,
  onClose,
  onSave,
}: Props) => {
  const getNormalizedCategory = (cat: string | undefined) => {
    if (!cat) return "OPEN";
    const val = String(cat).trim();
    if (val === "마감" || val.toUpperCase() === "CLOSE") return "CLOSE";
    if (val === "오픈" || val.toUpperCase() === "OPEN") return "OPEN";
    if (val === "결제" || val.toUpperCase() === "PAYMENT") return "PAYMENT";
    if (val === "기타" || val.toUpperCase() === "OTHER") return "OTHER";
    return "OPEN";
  };

  const parseContentToSteps = (content: string): Step[] => {
    if (!content) return [{ stepNumber: 1, title: "", descriptions: [""] }];
    const rawBlocks = content.split(/\n\s*\n/);
    return rawBlocks.map((block, index) => {
      const match = block.match(/^\[(.*?)\]\s*\n([\s\S]*)$/);
      if (match) {
        return {
          stepNumber: index + 1,
          title: match[1],
          descriptions: [match[2].trim()],
        };
      } else {
        return {
          stepNumber: index + 1,
          title: "",
          descriptions: [block.trim()],
        };
      }
    });
  };

  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState(
    getNormalizedCategory(initialData?.category),
  );
  const [steps, setSteps] = useState<Step[]>(
    initialData?.steps && initialData.steps.length > 0
      ? initialData.steps
      : [{ stepNumber: 1, title: "", descriptions: [""] }],
  );
  const [loading, setLoading] = useState(false);

  const CATEGORY_OPTIONS = [
    { label: "오픈", value: "OPEN" },
    { label: "마감", value: "CLOSE" },
    { label: "결제", value: "PAYMENT" },
    { label: "기타", value: "OTHER" },
  ];

  const fetchDetailData = async (manualId: number) => {
    try {
      setLoading(true);
      const getAuthData = async (key: string) => {
        if (Platform.OS === "web") return localStorage.getItem(key);
        const secureData = await SecureStore.getItemAsync(key);
        return secureData || (await AsyncStorage.getItem(key));
      };

      const token = await getAuthData("user_token");
      const response = await api.get(`/api/v1/manuals/${manualId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const detail = response.data.data || response.data;

      if (detail) {
        setTitle(detail.title || "");
        setCategory(getNormalizedCategory(detail.category));

        const contentData = detail.content || detail.context;
        if (
          detail.steps &&
          Array.isArray(detail.steps) &&
          detail.steps.length > 0
        ) {
          setSteps(detail.steps);
        } else if (contentData) {
          const parsed = parseContentToSteps(contentData);
          setSteps(parsed);
        }
      }
    } catch (error: any) {
      console.error("상세 정보 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "edit" && initialData) {
      const mId = initialData.manualId || (initialData as any).id;
      if (mId) fetchDetailData(Number(mId));
    }
  }, [mode]);

  const addStep = () => {
    setSteps([
      ...steps,
      { stepNumber: steps.length + 1, title: "", descriptions: [""] },
    ]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("알림", "업무 명칭을 입력해주세요.");
      return;
    }

    try {
      const getAuthData = async (key: string) => {
        if (Platform.OS === "web") return localStorage.getItem(key);
        const secureData = await SecureStore.getItemAsync(key);
        return secureData || (await AsyncStorage.getItem(key));
      };

      const token = await getAuthData("user_token");
      const username = await getAuthData("username");
      const userRes = await api.get("/api/v1/users/me", {
        params: { username },
        headers: { Authorization: `Bearer ${token}` },
      });

      const storeId = userRes.data.data?.storeId || userRes.data.storeId;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const combinedcontent = steps
        .map((s) => {
          const safeTitle = s.title ? s.title.trim() : "";
          const safeDesc = s.descriptions.join("\n").trim();
          return safeTitle ? `[${safeTitle}]\n${safeDesc}` : safeDesc;
        })
        .join("\n\n");

      const payload = {
        storeId: Number(storeId),
        title: title.trim(),
        content: combinedcontent,
        category: category,
        steps: steps.map((s) => ({
          stepNumber: s.stepNumber,
          title: s.title,
          descriptions: s.descriptions.filter((d) => d.trim() !== ""),
        })),
      };

      if (mode === "register") {
        await api.post("/api/v1/manuals", payload, config);
      } else {
        const mId = initialData?.manualId || (initialData as any).id;
        await api.patch(
          `/api/v1/manuals/${mId}`,
          {
            title: title.trim(),
            content: combinedcontent,
            category: category,
          },
          config,
        );
      }

      Alert.alert("성공", "저장되었습니다.");
      onSave();
      onClose();
    } catch (error: any) {
      console.error("저장 실패:", error);
      Alert.alert("실패", "서버 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onClose} style={{ paddingLeft: 20 }}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.detailMainTitle}>
            {mode === "register" ? "새 매뉴얼 등록" : "매뉴얼 수정"}
          </Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.inputLabel}>제목</Text>
            <TextInput
              style={styles.dashedInput}
              value={title}
              onChangeText={setTitle}
              placeholder="업무 명칭을 입력해주세요."
            />

            <Text style={styles.inputLabel}>카테고리</Text>
            <View style={styles.categoryContainer}>
              {CATEGORY_OPTIONS.map((item) => {
                const isSelected = category === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    onPress={() => setCategory(item.value)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>상세 설명</Text>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepInputBox}>
                <Text style={styles.stepLabel}>Step {step.stepNumber}</Text>
                <TextInput
                  style={{ fontSize: 20, fontWeight: "600", marginBottom: 10 }}
                  value={step.title}
                  onChangeText={(text) => {
                    const newSteps = [...steps];
                    newSteps[index].title = text;
                    setSteps(newSteps);
                  }}
                  placeholderTextColor="#333"
                  placeholder={
                    STEP_PLACEHOLDERS[index]?.title ||
                    `Step ${step.stepNumber} 제목`
                  }
                />
                <TextInput
                  style={{ fontSize: 15, color: "#000000", paddingTop: 10 }}
                  multiline
                  value={step.descriptions[0]}
                  onChangeText={(text) => {
                    const newSteps = [...steps];
                    newSteps[index].descriptions = [text];
                    setSteps(newSteps);
                  }}
                  placeholderTextColor="#333"
                  placeholder={
                    STEP_PLACEHOLDERS[index]?.desc ||
                    "세부 업무 내용을 입력해주세요"
                  }
                />
              </View>
            ))}

            <View style={styles.bottomBtnRow}>
              <TouchableOpacity style={styles.nextStepBtn} onPress={addStep}>
                <Text style={styles.nextStepBtnText}>다음 단계 추가하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>
                  {mode === "register" ? "매뉴얼 등록하기" : "수정 완료"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BossManualForm;
