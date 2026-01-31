import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// 👇 공통 컴포넌트
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { useNotificationCount } from "../../../hooks/useNotificationCount";

// 👇 대시보드 내부 컴포넌트 & 데이터
import {
    ScheduleCard
} from "../../../components/dashboard/BossDashboard";
import api from "../../../constants/api";
import { styles } from "../../../styles/tabs/boss/Dashboard";

// 1. 할 일 아이템 인터페이스 (서버 응답 기준)
interface TodoItem {
  todoId: number;
  content: string;
  done: boolean;
}

interface DashboardStats {
  totalCost: number;
  growthRate: number;
  payDate: string;
  inviteCode: string;
}

interface TodayAttendanceStatus {
  userId: number;
  name: string;
  status: "ON" | "OFF" | "LATE" | "ABSENT";
}

interface WeeklyScheduleApiItem {
  day: string;
  time: string;
  workers?: { scheduleId: number; name: string; breakTime: number }[];
}

interface WeeklyScheduleDay {
  day: string;
  schedules: { time: string; staff: string[] }[];
}

export default function DashboardScreen() {
  const router = useRouter();
  const pathname = usePathname();

  const [userName, setUserName] = useState("사장님");
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const notificationCount = useNotificationCount("boss");

  // 할 일 관련 상태
  const [todoText, setTodoText] = useState("");
  const [todoList, setTodoList] = useState<TodoItem[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    totalCost: 0,
    growthRate: 0,
    payDate: "-",
    inviteCode: "불러오는 중...",
  });
  const [todayAttendances, setTodayAttendances] = useState<
    TodayAttendanceStatus[]
  >([]);
  const [todayTotalPay, setTodayTotalPay] = useState(0);
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklyScheduleDay[]>(
    [],
  );

  const getUsernameFromStorage = async () => {
    try {
      return await AsyncStorage.getItem("username");
    } catch (e) {
      return null;
    }
  };

  const getAuthHeader = async () => {
    try {
      const token = await AsyncStorage.getItem("user_token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
      return {};
    }
  };

  const getWeekStartDate = () => {
    const now = new Date();
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day);
    return sunday.toISOString().split("T")[0];
  };

  const dayOrder = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayLabelMap: Record<string, string> = {
    SUN: "일",
    MON: "월",
    TUE: "화",
    WED: "수",
    THU: "목",
    FRI: "금",
    SAT: "토",
  };

  const initializeDashboard = async () => {
    try {
      if (!currentStoreId) setIsLoading(true);
      const username = await getUsernameFromStorage();
      if (!username) {
        setIsLoading(false);
        return;
      }

      const storeId = await fetchUserInfo(username);
      if (storeId) {
        setCurrentStoreId(storeId);
        await Promise.all([
          fetchTodos(storeId),
          fetchDashboardData(storeId),
          fetchTodayAttendances(storeId),
          fetchWeeklySchedules(storeId),
        ]);
      } else {
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
      const headers = await getAuthHeader();
      const response = await api.get("/api/v1/users/me", {
        params: { username: username },
        headers,
      });
      const { name, storeId } = response.data;
      if (name) setUserName(name);
      return storeId || null;
    } catch (error: any) {
      return null;
    }
  };

  const fetchDashboardData = async (storeId: number) => {
    try {
      const headers = await getAuthHeader();
      const now = new Date();
      const dashboardRes = await api.get("/api/v1/stores/dashboard", {
        params: { storeId, year: now.getFullYear(), month: now.getMonth() + 1 },
        headers,
      });
      const storeRes = await api.get(`/api/v1/stores/${storeId}`);

      setStats({
        totalCost: dashboardRes.data.totalCost || 0,
        growthRate: dashboardRes.data.growthRate || 0,
        payDate: dashboardRes.data.payDate || "-",
        inviteCode:
          storeRes.data.inviteCode || storeRes.data.invite_code || "코드 없음",
      });
    } catch (error) {
      setStats((prev) => ({ ...prev, inviteCode: "오류" }));
    }
  };

  const fetchTodayAttendances = async (storeId: number) => {
    try {
      const headers = await getAuthHeader();
      const response = await api.get("/api/v1/attendances/today", {
        params: { storeId },
        headers,
      });
      const payload = response.data?.data || response.data;
      const list =
        payload?.list || payload?.attendances || payload?.items || [];
      setTodayAttendances(Array.isArray(list) ? list : []);
      const totalPay =
        payload?.totalPay ??
        payload?.totalCost ??
        payload?.totalWage ??
        payload?.expectedPay ??
        0;
      setTodayTotalPay(Number(totalPay) || 0);
    } catch (error) {
      setTodayAttendances([]);
      setTodayTotalPay(0);
    }
  };

  const fetchWeeklySchedules = async (storeId: number) => {
    try {
      const headers = await getAuthHeader();
      const startDate = getWeekStartDate();
      const response = await api.get("/api/v1/schedules/weekly", {
        params: { storeId, startDate },
        headers,
      });
      const payload = response.data?.data || response.data;
      const list: WeeklyScheduleApiItem[] = Array.isArray(payload)
        ? payload
        : payload?.list || payload?.items || [];

      const grouped = dayOrder.map((day) => {
        const items = list.filter((item) => item.day === day);
        return {
          day: dayLabelMap[day] || day,
          schedules: items.map((item) => ({
            time: item.time,
            staff: (item.workers || []).map((w) => w.name),
          })),
        };
      });
      setWeeklySchedules(grouped);
    } catch (error) {
      setWeeklySchedules(
        dayOrder.map((day) => ({ day: dayLabelMap[day] || day, schedules: [] })),
      );
    }
  };

  // 할 일 목록 가져오기
  const fetchTodos = async (storeId: number) => {
    try {
      const response = await api.get("/api/v1/todos", { params: { storeId } });
      setTodoList(response.data || []);
    } catch (error) {
      console.error("할 일 로드 실패");
    }
  };

  useFocusEffect(
    useCallback(() => {
      initializeDashboard();
    }, []),
  );

  const copyToClipboard = async () => {
    if (
      stats.inviteCode === "불러오는 중..." ||
      stats.inviteCode === "코드 없음"
    )
      return;
    await Clipboard.setStringAsync(stats.inviteCode);
    Alert.alert(
      "복사 완료",
      `초대 코드 [${stats.inviteCode}]가 복사되었습니다.`,
    );
  };

  const addTodo = async () => {
    if (todoText.trim() === "" || !currentStoreId) return;
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
      await api.patch(`/api/v1/todos/${todoId}/toggle`);
    } catch (error) {
      if (currentStoreId) fetchTodos(currentStoreId);
    }
  };

  const deleteTodo = (todoId: number) => {
    Alert.alert("삭제", "이 할 일을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        onPress: async () => {
          try {
            const response = await api.delete(`/api/v1/todos/${todoId}`);
            if (response.data.success) {
              setTodoList((prev) => prev.filter((i) => i.todoId !== todoId));
            }
          } catch (error) {
            Alert.alert("오류", "삭제 실패");
          }
        },
      },
    ]);
  };

  const formatNumber = (num: number) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const weekSchedules =
    weeklySchedules.length > 0
      ? weeklySchedules
      : dayOrder.map((day) => ({
          day: dayLabelMap[day] || day,
          schedules: [],
        }));


  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#E0D5FF" />
      </SafeAreaView>
    );
  }

  // 🔴 매장 없음 뷰 (푸터 로직 포함)
  if (!currentStoreId) {
    return (
      <SafeAreaView style={styles.container}>
        <Header notificationCount={notificationCount} />
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <Text style={{ fontSize: 25, fontWeight: "bold" }}>
            반갑습니다, <Text style={{ color: "#9747FF" }}>{userName}</Text>님!
            👋
          </Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <Ionicons name="storefront-outline" size={80} color="#C4C4C4" />
            <Text style={styles.emptyTitle}>등록된 매장이 없습니다</Text>
            <Text style={styles.emptyDesc}>
              매장을 등록하고 직원 관리와 급여 정산을{"\n"}시작해보세요!
            </Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push("/(tabs)/boss/Registration")}
            >
              <Text style={styles.registerButtonText}>매장 등록하러 가기</Text>
              <Ionicons name="arrow-forward" size={20} color="#9747FF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ✅ 매장이 없을 때는 클릭 불가능한 안내 바를 표시합니다. */}
        <View
          style={{
            height: 85,
            backgroundColor: "#F9F9F9",
            borderTopWidth: 1,
            borderTopColor: "#EEE",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#CCC", fontSize: 12 }}>
            매장 등록 후 메뉴 이용이 가능합니다
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 🟢 매장 있을 때 (정상 대시보드 컨텐츠)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Header notificationCount={notificationCount} />

        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>
            반갑습니다, <Text style={styles.greetingName}>{userName}</Text>님!👋
          </Text>
        </View>

        <View style={styles.inviteRow}>
          <TouchableOpacity
            style={styles.inviteCodeBadge}
            onPress={copyToClipboard}
          >
            <Text style={styles.inviteText}>
              초대 코드{" "}
              <Text style={styles.purpleText}>{stats.inviteCode}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualButton}
            activeOpacity={0.7}
            onPress={() => {
              const userType = pathname.includes("/staff") ? "staff" : "boss";
              router.push(`/(tabs)/${userType}/Manual`);
            }}
          >
            <Text style={styles.manualButtonText}>매뉴얼 등록하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>인건비 및 근무 현황</Text>
          <Text style={styles.dateText}>
            정산일 {stats.payDate.replace(/-/g, ".")}
          </Text>
          <View style={styles.costContainer}>
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
              증가했습니다.
            </Text>
          </View>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 To Do List</Text>
          {todoList.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <Text style={{ color: "#AFAFAF" }}>
                오늘의 할 일을 입력해 주세요✏️
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
                    <Ionicons name="checkmark" size={14} color="#fff" />
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
              placeholder="할 일을 입력해주세요"
              style={styles.input}
              onSubmitEditing={addTodo}
            />
            <TouchableOpacity onPress={addTodo}>
              <Ionicons name="add-circle" size={32} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>근무 시간표</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {weekSchedules.map((day, idx) => (
              <View key={idx} style={{ marginRight: 12 }}>
                <ScheduleCard data={day} />
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* ✅ 매장이 있을 때만 실제 푸터 컴포넌트를 렌더링합니다. */}
      {currentStoreId && <Footer />}
    </SafeAreaView>
  );
}
