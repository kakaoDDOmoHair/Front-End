import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../styles/tabs/boss/Manual";
import { ManualItem } from "./BossData";

interface Props {
  manualList: ManualItem[];
  selectedManual: ManualItem | null;
  onSelect: (item: ManualItem | null) => void;
  onRegister: () => void;
  onEdit: (item: ManualItem) => void;
  onDelete: (manualId: number) => void;
}

export const BossManual = ({
  manualList,
  selectedManual,
  onSelect,
  onRegister,
  onEdit,
  onDelete,
}: Props) => {
  const router = useRouter();

  const confirmDelete = (manualId: number, title: string) => {
    Alert.alert("매뉴얼 삭제", `"${title}" 매뉴얼을 삭제하시겠습니까?`, [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        style: "destructive",
        onPress: () => onDelete(manualId),
      },
    ]);
  };

  // --- 상세 조회 화면 ---
  if (selectedManual) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.detailHeader}>
          <TouchableOpacity
            onPress={() => onSelect(null)}
            style={{ paddingLeft: 20 }}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.detailMainTitle}>
            {selectedManual.category} - {selectedManual.title}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>상세 설명</Text>

            {/* 🌟 [디자인 수정] 단순 텍스트가 아니라 Form과 똑같은 박스 스타일로 감싸줍니다 */}
            {selectedManual.steps && selectedManual.steps.length > 0 ? (
              // 1. Steps 배열이 살아있는 경우 (가장 이상적)
              selectedManual.steps.map((step, index) => (
                <View key={index} style={styles.stepInputBox}>
                  <Text style={styles.stepLabel}>Step {step.stepNumber}</Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      marginBottom: 10,
                    }}
                  >
                    {step.title || "상세 내용"}
                  </Text>
                  <Text
                    style={{ fontSize: 15, color: "#000000", lineHeight: 20 }}
                  >
                    {step.descriptions.join("\n")}
                  </Text>
                </View>
              ))
            ) : (
              // 2. content 문자열만 있는 경우 -> 가짜 Step 1 박스를 만들어 예쁘게 보여줌
              <View style={styles.stepInputBox}>
                <Text style={styles.stepLabel}>Step 1</Text>
                <Text
                  style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}
                >
                  상세 내용
                </Text>
                <Text style={{ fontSize: 15, color: "#000", lineHeight: 20 }}>
                  {selectedManual.content || "등록된 상세 내용이 없습니다."}
                </Text>
              </View>
            )}
          </View>

          {/* 하단 버튼 영역 */}
          <View style={[styles.bottomBtnRow, { marginTop: 40, gap: 10 }]}>
            <TouchableOpacity
              style={[
                styles.nextStepBtn,
                {
                  flex: 1,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "#AFAFAF",
                  padding: 15,
                  borderRadius: 15,
                  alignItems: "center",
                },
              ]}
              onPress={() =>
                confirmDelete(selectedManual.manualId, selectedManual.title)
              }
            >
              <Text
                style={{ color: "#FF383C", fontWeight: "700", fontSize: 16 }}
              >
                삭제
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  flex: 1,
                  backgroundColor: "#E8E5FF99",
                  padding: 15,
                  borderRadius: 15,
                  alignItems: "center",
                },
              ]}
              onPress={() => onEdit(selectedManual)}
            >
              <Text
                style={{ color: "#9747FF", fontWeight: "700", fontSize: 16 }}
              >
                수정하기
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- 목록 화면 ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 90, height: 70 }}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={() => router.push("./notification")}>
          <View style={{ position: "relative" }}>
            <Ionicons name="notifications" size={24} color="#D1C4E9" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>매뉴얼 관리</Text>

        <TouchableOpacity
          style={styles.registerBtn}
          activeOpacity={0.8}
          onPress={onRegister}
        >
          <Text style={styles.registerBtnText}>+ 새 매뉴얼 등록하기</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { fontSize: 25 }]}>관리 리스트</Text>

        {manualList.map((item) => (
          <View key={item.manualId} style={styles.card}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>

            <View style={styles.btnGroup}>
              <TouchableOpacity
                style={styles.detailBadge}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.detailText}>자세히보기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBadge}
                onPress={() => confirmDelete(item.manualId, item.title)}
              >
                <Text style={styles.deleteText}>삭제</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {manualList.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ color: "#AFAFAF" }}>등록된 매뉴얼이 없습니다.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
