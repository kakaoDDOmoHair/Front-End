  import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react'; // useState 추가
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

  import { BossNotificationItem } from "@/components/notification/BossNotification";
import Footer from "../../../components/common/Footer";
import { NOTIFICATIONS as INITIAL_DATA, NotificationItemData } from "../../../components/notification/StaffData";
import { NotificationItem } from "../../../components/notification/StaffNotification";
import { styles } from "../../../styles/tabs/staff/Notification";

  export default function NotificationScreen() {
    const router = useRouter();

    // 1. 알림 데이터를 상태로 관리하여 '읽음' 처리가 화면에 즉시 반영되도록 함
    const [notifications, setNotifications] = useState<NotificationItemData[]>(INITIAL_DATA);

    // 2. 알림 클릭 시 실행되는 함수: 해당 ID의 알림을 읽음(isRead: true) 상태로 변경
    const handleNotificationPress = (id: number) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      // 추가 기능 필요 시: router.push('/target-path');
    };

    // 3. 필터링 로직: notifications 상태를 감시하여 데이터가 바뀔 때마다 섹션 재계산
    const todayNotifications = useMemo(() => 
      notifications.filter((n) => n.category === '오늘'), [notifications]);
    const yesterdayNotifications = useMemo(() => 
      notifications.filter((n) => n.category === '어제'), [notifications]);
    const thisWeekNotifications = useMemo(() => 
      notifications.filter(n => n.category === '이번 주'), [notifications]);
    

    // '이전 알림' 기능: 오늘과 어제 이번 주 모든 알림 표시
    const earlierNotifications = useMemo(() => 
      notifications.filter((n) => n.category !== '오늘' && n.category !== '어제' && n.category !== '이번 주'), [notifications]);

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* 오늘 섹션 */}
          {todayNotifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>오늘</Text>
              {todayNotifications.map((n) => (
                <NotificationItem 
                  key={n.id} 
                  data={n} 
                  onPress={() => handleNotificationPress(n.id)} 
                />
              ))}
            </View>
          )}

          {/* 어제 섹션 */}
          {yesterdayNotifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>어제</Text>
              {yesterdayNotifications.map((n) => (
                <NotificationItem 
                  key={n.id} 
                  data={n} 
                  onPress={() => handleNotificationPress(n.id)} 
                />
              ))}
            </View>
          )}

        {/* 이번 주 (이미지 하단 승인/거절 버튼 포함 섹션) */}
        {thisWeekNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>이번 주</Text>
            {thisWeekNotifications.map((n) => (
              <BossNotificationItem 
                key={n.id} 
                data={n} 
                onPress={() => handleNotificationPress(n.id)} 
              />
            ))}
          </View>
        )}
          
        {/* 알림이 아예 없을 때 */}
          {notifications.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>새로운 알림이 없습니다</Text>
            </View>
          )}
        </ScrollView>
        <Footer />
      </SafeAreaView>
    );
  }