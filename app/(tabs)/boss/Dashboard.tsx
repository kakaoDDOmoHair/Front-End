import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ScheduleCard,
  TabItem,
  WorkerCard,
} from "../../../components/dashboard/BossDashboard";
import { SCHEDULES, WORKERS } from "../../../components/dashboard/Data";
import api from "../../../constants/api";
import { styles } from "../../../styles/tabs/boss/Dashboard";

interface TodoItem {
  todoId: number;
  content: string;
  done: boolean;
}

// 📊 통계 데이터 타입 정의
interface DashboardStats {
  totalCost: number;
  growthRate: number;
  payDate: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [todoText, setTodoText] = useState("");
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [userName, setUserName] = useState("사장님");

  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(3);

  // 📊 통계 상태 (초기값 설정)
  const [stats, setStats] = useState<DashboardStats>({
    totalCost: 0,
    growthRate: 0,
    payDate: "-",
  });

  // AsyncStorage 사용
  const getUsernameFromStorage = async () => {
    try {
      return await AsyncStorage.getItem("username");
    } catch (e) {
      return null;
    }
  };

  const initializeDashboard = async () => {
    try {
      if (!currentStoreId) setIsLoading(true);

      const username = await getUsernameFromStorage();

      if (!username) {
        console.log("⚠️ 저장된 아이디가 없습니다.");
        setIsLoading(false);
        return;
      }

      const storeId = await fetchUserInfo(username);

      if (storeId) {
        console.log("✅ 매장 확인됨 (ID:", storeId, ")");
        setCurrentStoreId(storeId);

        // 🔥 [추가] 통계 데이터와 할 일 목록을 동시에 불러옴
        await Promise.all([
          fetchTodos(storeId),
          fetchDashboardStats(storeId), // 통계 API 호출
        ]);
      } else {
        console.log("⚠️ 아직 매장이 없습니다.");
        setCurrentStoreId(null);
      }
    } catch (error) {
      console.error("대시보드 초기화 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserInfo = async (username: string) => {
    try {
      const response = await api.get("/api/v1/users/me", {
        params: { username: username },
      });
      const { name, storeId } = response.data;
      if (name) setUserName(name);
      return storeId || null;
    } catch (error: any) {
      return null;
    }
  };

  // 📊 [신규] 대시보드 통계 조회 API
  const fetchDashboardStats = async (storeId: number) => {
    try {
      const now = new Date();
      // 현재 년/월 기준 조회 (파라미터 선택사항이지만 보내는 게 확실함)
      const response = await api.get("/api/v1/stores/dashboard", {
        params: {
          storeId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        },
      });

      // 응답 예시: { "totalCost": 4250000, "growthRate": 5.2, "payDate": "2026-01-05" }
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("❌ 통계 조회 실패:", error);
      // 실패 시 기본값 유지
    }
  };

  const fetchTodos = async (storeId: number) => {
    try {
      const response = await api.get("/api/v1/todos", {
        params: { storeId },
      });
      setTodoList(response.data || []);
    } catch (error) {
      console.error("할 일 목록 로드 실패");
    }
  };

  useFocusEffect(
    useCallback(() => {
      initializeDashboard();
    }, []),
  );

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync("135155");
    Alert.alert("알림", "초대 코드가 복사되었습니다.");
  };

  const addTodo = async () => {
    if (todoText.trim() === "") return;
    if (!currentStoreId) return;
    try {
      const response = await api.post("/api/v1/todos", {
        storeId: currentStoreId,
        content: todoText,
      });
      if (response.data.success) {
        await fetchTodos(currentStoreId);
        setTodoText("");
      }
    } catch (error) {
      Alert.alert("오류", "할 일 등록 실패");
    }
  };

  const toggleTodo = async (todoId: number) => {
    try {
      setTodoList((prev) =>
        prev.map((item) =>
          item.todoId === todoId ? { ...item, done: !item.done } : item,
        ),
      );
      const response = await api.patch(`/api/v1/todos/${todoId}/toggle`);
      if (response.data.success && currentStoreId) {
        fetchTodos(currentStoreId);
      }
    } catch (error) {
      if (currentStoreId) fetchTodos(currentStoreId);
    }
  };

  const deleteTodo = (todoId: number) => {
    Alert.alert("삭제", "삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        onPress: async () => {
          try {
            const response = await api.delete(`/api/v1/todos/${todoId}`);
            if (response.data.success) {
              setTodoList((prev) => prev.filter((i) => i.todoId !== todoId));
            }
          } catch (error) {}
        },
      },
    ]);
  };

  // 숫자 포맷팅 (3자리 콤마)
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 1. 로딩 중
  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={{ marginTop: 10, color: "#666" }}>
          정보를 불러오는 중...
        </Text>
      </SafeAreaView>
    );
  }

  // 2. 매장 없음 (등록 유도)
  if (!currentStoreId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={{ width: 90, height: 70 }}
            resizeMode="contain"
          />
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            반갑습니다, <Text style={{ color: "#6C5CE7" }}>{userName}</Text>님!
            👋
          </Text>
        </View>

        <View style={localStyles.emptyContainer}>
          <View style={localStyles.emptyContent}>
            <Ionicons name="storefront-outline" size={80} color="#ddd" />
            <Text style={localStyles.emptyTitle}>등록된 매장이 없습니다</Text>
            <Text style={localStyles.emptyDesc}>
              매장을 등록하고 직원 관리와 급여 정산을{"\n"}시작해보세요!
            </Text>

            <TouchableOpacity
              style={localStyles.registerButton}
              onPress={() => router.push("/(tabs)/boss/Registration")}
            >
              <Text style={localStyles.registerButtonText}>
                매장 등록하러 가기
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomTab}>
          <TabItem icon="wifi" label="출퇴근관리" />
          <TabItem icon="document-text" label="계약서" />
          <TabItem icon="home" label="홈" active />
          <TabItem icon="wallet" label="급여관리" />
          <TabItem icon="person" label="프로필" />
        </View>
      </SafeAreaView>
    );
  }

  // 3. 매장 있음 (정상 대시보드)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require("../../../assets/images/logo.png")}
            style={{ width: 90, height: 70 }}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={() => router.push("./(tabs)/boss/Notification")}
            style={{ position: "relative" }}
          >
            <Ionicons name="notifications" size={24} color="#D1C4E9" />
            {notificationCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  backgroundColor: "#FF4444",
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 11, fontWeight: "bold" }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            반갑습니다, <Text style={{ color: "#6C5CE7" }}>{userName}</Text>님!
            👋
          </Text>
        </View>

        <View style={styles.inviteRow}>
          <TouchableOpacity
            style={styles.inviteCodeBadge}
            onPress={copyToClipboard}
          >
            <Text style={styles.inviteText}>
              초대 코드 <Text style={styles.purpleText}>135155</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualButton}
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)/boss/Manual")}
          >
            <Text style={styles.manualButtonText}>매뉴얼 등록하기</Text>
          </TouchableOpacity>
        </View>

        {/* 📊 인건비 (API 데이터 적용) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>인건비 및 근무 현황</Text>
          {/* payDate 포맷 변경 (2026-01-05 -> 2026.01.05) */}
          <Text style={styles.dateText}>
            정산일 {stats.payDate.replace(/-/g, ".")}
          </Text>
          <View style={styles.costContainer}>
            {/* totalCost에 콤마 찍기 */}
            <Text style={styles.costAmount}>
              {formatNumber(stats.totalCost)}
            </Text>
            <Text style={styles.costDesc}>
              전월 대비{" "}
              <Text
                style={{
                  color: stats.growthRate >= 0 ? "#FF4444" : "#4444FF",
                  fontWeight: "bold",
                }}
              >
                {stats.growthRate >= 0 ? "+ " : ""}
                {stats.growthRate}%
              </Text>{" "}
              {stats.growthRate >= 0 ? "증가" : "감소"}했습니다.
            </Text>
          </View>
        </View>

        {/* 근무자 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>현재 근무 중</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>3명</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {WORKERS.map((worker) => (
              <View key={worker.id} style={{ marginRight: 15 }}>
                <WorkerCard data={worker} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* To Do List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 To Do List</Text>
          {todoList.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <Text style={{ color: "#AFAFAF" }}>
                오늘의 할 일을 작성해주세요 ✏️
              </Text>
            </View>
          ) : (
            todoList.map((item) => (
              <TouchableOpacity
                key={item.todoId}
                style={styles.todoItem}
                onPress={() => toggleTodo(item.todoId)}
                onLongPress={() => deleteTodo(item.todoId)}
              >
                <View
                  style={[
                    styles.checkbox,
                    item.done && {
                      backgroundColor: "#000",
                      borderColor: "#000",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  {item.done && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                <Text
                  style={[
                    styles.todoText,
                    item.done && {
                      textDecorationLine: "line-through",
                      color: "#AFAFAF",
                    },
                  ]}
                >
                  {item.content}
                </Text>
              </TouchableOpacity>
            ))
          )}
          <View style={styles.inputContainer}>
            <TextInput
              value={todoText}
              onChangeText={setTodoText}
              placeholder="오늘의 할 일을 입력해주세요"
              style={styles.input}
              onSubmitEditing={addTodo}
            />
            <TouchableOpacity onPress={addTodo}>
              <Ionicons name="add-circle" size={28} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 근무 시간표 */}
        <View style={[styles.section, { marginBottom: 80 }]}>
          <Text style={styles.sectionTitle}>근무 시간표</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {SCHEDULES.map((day, idx) => (
              <View key={idx} style={{ marginRight: 12 }}>
                <ScheduleCard data={day} />
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.bottomTab}>
        <TabItem icon="wifi" label="출퇴근관리" />
        <TabItem icon="document-text" label="계약서" />
        <TabItem icon="home" label="홈" active />
        <TabItem icon="wallet" label="급여관리" />
        <TabItem icon="person" label="프로필" />
      </View>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContent: {
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 30,
    borderRadius: 20,
    width: "90%",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    color: "#333",
  },
  emptyDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 20,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6C5CE7",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 3,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
});
