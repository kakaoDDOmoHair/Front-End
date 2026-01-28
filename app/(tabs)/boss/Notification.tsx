import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { BOSS_NOTIFICATIONS as INITIAL_DATA } from "../../../components/notification/BossData";
import { BossNotificationItem } from "../../../components/notification/BossNotification";
import { styles } from "../../../styles/tabs/boss/Notification";

export default function BossNotificationScreen() {
  const router = useRouter();
  // 상태 관리를 위해 초기 데이터를 state로 관리합니다.
  const [notifications, setNotifications] = useState(INITIAL_DATA);

  // 1. 알림 클릭 시 읽음 처리 (불변성 유지하며 업데이트)
  const handleNotificationPress = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  };

  // 2. [승인] 버튼 핸들러
  const handleApprove = (id: number) => {
    Alert.alert("승인 완료", "알바생에게 수정 요청 승인 알림을 보냈습니다.", [
      {
        text: "확인",
        onPress: () => {
          // 승인 후 리스트에서 제거하거나 상태를 변경할 수 있습니다.
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        },
      },
    ]);
  };

  // 3. [거절] 버튼 핸들러
  const handleReject = (id: number) => {
    Alert.alert("요청 거절", "정말 거절하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "거절",
        style: "destructive",
        onPress: () => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        },
      },
    ]);
  };

  // 카테고리별 필터링 (useMemo를 사용해 성능 최적화)
  const todayNotifications = useMemo(
    () => notifications.filter((n) => n.category === "오늘"),
    [notifications],
  );
  const yesterdayNotifications = useMemo(
    () => notifications.filter((n) => n.category === "어제"),
    [notifications],
  );
  const thisWeekNotifications = useMemo(
    () => notifications.filter((n) => n.category === "이번 주"),
    [notifications],
  );

  // 공통 렌더링 함수
  const renderNotificationSection = (
    title: string,
    data: typeof notifications,
  ) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{title}</Text>
        {data.map((n) => (
          <BossNotificationItem
            key={n.id}
            data={n}
            onPress={() => handleNotificationPress(n.id)}
            onApprove={handleApprove} // 핸들러 전달
            onReject={handleReject} // 핸들러 전달
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 센터</Text>
        <View style={{ width: 26 }} /> {/* 좌우 균형을 위한 빈 공간 */}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderNotificationSection("오늘", todayNotifications)}
        {renderNotificationSection("어제", yesterdayNotifications)}
        {renderNotificationSection("이번 주", thisWeekNotifications)}
      </ScrollView>
    </SafeAreaView>
  );
}
