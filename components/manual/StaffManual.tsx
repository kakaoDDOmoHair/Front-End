import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../styles/tabs/staff/Manual";
import { ManualItem } from "./StaffData";
interface Props {
  manualList: ManualItem[]; // 🚨 [수정 2] 부모한테서 리스트를 받겠다고 선언
  selectedManual: ManualItem | null;
  onSelect: (item: ManualItem | null) => void;
}

export const StaffManual = ({
  manualList,
  selectedManual,
  onSelect,
}: Props) => {
  const router = useRouter();

  // --- 상세 화면 (Detail) ---
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
          <Text style={styles.summaryText}>
            {selectedManual.category} 시 가장 먼저 해야할{" "}
            <Text style={styles.highlight}>
              {selectedManual.steps?.length || 0}단계
            </Text>{" "}
            입니다.
          </Text>

          {/* 🌟 [데이터 연동] 부모가 파싱해준 steps를 그대로 보여줍니다 */}
          {selectedManual.steps?.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>
                Step {step.stepNumber}. {step.title}
              </Text>
              {step.descriptions.map((desc, idx) => (
                <Text key={idx} style={styles.stepDesc}>
                  - {desc}
                </Text>
              ))}
            </View>
          ))}

          {(!selectedManual.steps || selectedManual.steps.length === 0) && (
            <Text
              style={{ marginTop: 20, textAlign: "center", color: "#AFAFAF" }}
            >
              상세 내용이 없습니다.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- 리스트 화면 (헤더/푸터는 페이지에서 공통 컴포넌트로 처리) ---
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>관리 리스트</Text>

        {/* 🚨 [수정 3] 가짜 데이터 대신 props로 받은 manualList(서버 데이터)를 사용 */}
        {manualList.map((item) => (
          <View key={item.manualId} style={styles.card}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>

            <TouchableOpacity
              style={styles.detailBadge}
              onPress={() => onSelect(item)} // 클릭하면 부모에게 "이거 상세정보 가져와!"라고 알림
              activeOpacity={0.7}
            >
              <Text style={styles.detailText}>자세히보기</Text>
            </TouchableOpacity>
          </View>
        ))}

        {manualList.length === 0 && (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <Text style={{ color: "#AFAFAF", fontSize: 16 }}>
              등록된 매뉴얼이 없습니다.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
