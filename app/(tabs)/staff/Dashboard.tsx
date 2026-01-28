import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { useFocusEffect, useRouter } from 'expo-router'; // useFocusEffect 추가
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// 경로 및 컴포넌트 임포트
import { ScheduleCard, TabItem } from '../../../components/dashboard/BossDashboard';
import { SCHEDULES } from '../../../components/dashboard/Data';
import { styles } from '../../../styles/tabs/staff/Dashboard';
// 알림 데이터 임포트
import { NOTIFICATIONS as INITIAL_NOTIFICATIONS } from '../../../components/notification/StaffData';

interface TodoItem {
  id: number;
  text: string;
  isCompleted: boolean;
}

const StatusIndicator = ({ icon, label, isActive }: { icon: any, label: string, isActive: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <Ionicons name={icon} size={16} color={isActive ? '#34C759' : '#AFAFAF'} />
    <Text style={{ fontSize: 13, color: isActive ? '#000' : '#AFAFAF', fontWeight: isActive ? '600' : '400' }}>
      {label}
    </Text>
  </View>
);

export default function DashboardScreen() {
  const router = useRouter();
  const [todoText, setTodoText] = useState('');
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({ wifi: false, gps: false, auth: false });
  const [locationName, setLocationName] = useState('위치 확인 중...');

  // --- 1. 알림 관련 로직 ---
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // 화면이 포커스될 때마다 알림 데이터 상태를 동기화 (알림 읽고 돌아왔을 때 배지 업데이트용)
  useFocusEffect(
    useCallback(() => {
      // 실제 앱에서는 여기서 API 호출을 하거나 전역 상태를 가져옵니다.
      // 현재는 로컬 데이터 파일의 변경사항을 반영하도록 설정합니다.
      setNotifications([...INITIAL_NOTIFICATIONS]);
    }, [])
  );

  // 안 읽은 알림 개수 계산 (isRead가 false인 항목 개수)
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length, 
  [notifications]);

  // --- 2. 기존 기능 로직 ---

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync('135155');
    Alert.alert('알림', '초대 코드가 복사되었습니다.');
  };

  const addTodo = () => {
    if (todoText.trim() === '') {
      Alert.alert('알림', '할 일을 입력해주세요.');
      return;
    }
    const newTodo: TodoItem = { id: Date.now(), text: todoText, isCompleted: false };
    setTodoList([...todoList, newTodo]);
    setTodoText('');
  };

  const toggleTodo = (id: number) => {
    setTodoList(todoList.map((item) => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };

  const deleteTodo = (id: number) => {
    Alert.alert('삭제', '이 할 일을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', onPress: () => setTodoList(todoList.filter(item => item.id !== id)) }
    ]);
  };

  const checkAllStatus = async () => {
    try {
      const networkStatus = await Network.getNetworkStateAsync();
      const isWifi = networkStatus.type === Network.NetworkStateType.WIFI;
      const { status } = await Location.requestForegroundPermissionsAsync();
      const isGpsReady = status === 'granted' && await Location.hasServicesEnabledAsync();

      if (isGpsReady) {
        const location = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address.length > 0) {
          const addr = address[0];
          setLocationName(`${addr.district || ''} ${addr.street || ''}`.trim() || '위치 확인 완료');
        }
      } else { setLocationName('GPS 꺼짐'); }

      setConnectionStatus({ wifi: isWifi, gps: isGpsReady, auth: networkStatus.isInternetReachable ?? false });
    } catch (e) { setLocationName('위치 확인 실패'); }
  };

  useEffect(() => {
    checkAllStatus();
    const interval = setInterval(checkAllStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = () => {
    if (!connectionStatus.wifi && !connectionStatus.gps) {
      Alert.alert('출근 불가', '매장 와이파이에 연결하거나,\nGPS를 켜주세요!', [
        { text: '확인' }, { text: '설정으로 이동', onPress: () => Linking.openSettings() }
      ]);
      return;
    }
    setIsWorking(!isWorking);
    Alert.alert('알림', isWorking ? '퇴근 처리되었습니다. 고생하셨습니다!' : '출근 처리되었습니다. 오늘도 화이팅!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 헤더: 로고 및 알림 배지 연동 */}
        <View style={styles.header}>
          <Image source={require('../../../assets/images/logo.png')} style={{ width: 75, height: 70 }} resizeMode="contain" />
          <TouchableOpacity 
            style={{ position: 'relative', padding: 5 }}
            onPress={() => router.push('/staff/Notification')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={26} color="#D1C4E9" />
            {unreadCount > 0 && (
              <View style={badgeStyles.badge}>
                <Text style={badgeStyles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 초대 코드 섹션 */}
        <View style={styles.inviteRow}>
          <TouchableOpacity style={styles.inviteCodeBadge} onPress={copyToClipboard}>
            <Text style={styles.inviteText}>초대 코드 <Text style={styles.purpleText}>135155</Text></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualButton}><Text style={styles.manualButtonText}>매뉴얼 열람하기</Text></TouchableOpacity>
        </View>

        {/* 출퇴근 버튼 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘도 화이팅! 💰</Text>
          <Text style={styles.statusText}>현재 상태 : {isWorking ? '근무 중' : '출근 전'}</Text>
          <TouchableOpacity 
            style={[styles.checkInButton, (!connectionStatus.wifi && !connectionStatus.gps) && { backgroundColor: '#E0D5FF' }]}
            onPress={handleCheckIn}
          >
            <Text style={[styles.checkInButtonText, (!connectionStatus.wifi && !connectionStatus.gps) && { color: '#afafaf' }]}>
              {isWorking ? '퇴근하기' : connectionStatus.wifi ? '출근하기 (WiFi)' : '출근하기 (GPS)'}
            </Text>
          </TouchableOpacity>

          <View style={styles.locationRow}>
            <StatusIndicator icon="wifi" label={connectionStatus.wifi ? "매장 와이파이" : "와이파이 없음"} isActive={connectionStatus.wifi} />
            <View style={{ width: 1, height: 12, backgroundColor: '#E0D5FF' }} />
            <StatusIndicator icon="location" label={connectionStatus.wifi ? "WiFi 사용 중" : (connectionStatus.gps ? locationName : "GPS 꺼짐")} isActive={!connectionStatus.wifi && connectionStatus.gps} />
          </View>
        </View>

        {/* To Do List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 To Do List</Text>
          {todoList.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}><Text style={{ color: '#AFAFAF' }}>오늘의 할 일을 입력해주세요 ✏️</Text></View>
          ) : (
            todoList.map((item) => (
              <TouchableOpacity key={item.id} style={styles.todoItem} onPress={() => toggleTodo(item.id)} onLongPress={() => deleteTodo(item.id)}>
                <View style={[styles.checkbox, item.isCompleted && { backgroundColor: '#9747FF', borderColor: '#9747FF', justifyContent: 'center', alignItems: 'center' }]}>
                  {item.isCompleted && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={[styles.todoText, item.isCompleted && { textDecorationLine: 'line-through', color: '#AFAFAF' }]}>{item.text}</Text>
              </TouchableOpacity>
            ))
          )}
          <View style={styles.inputContainer}>
            <TextInput value={todoText} onChangeText={setTodoText} placeholder="할 일을 입력해주세요" style={styles.input} onSubmitEditing={addTodo} />
            <TouchableOpacity onPress={addTodo}><Ionicons name="add-circle" size={32} color="#000" /></TouchableOpacity>
          </View>
        </View>

        {/* 근무 시간표 */}
        <View style={[styles.section, { marginBottom: 80 }]}>
          <Text style={styles.sectionTitle}>근무 시간표</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {SCHEDULES.map((day, idx) => (
              <View key={idx} style={{ marginRight: 12 }}><ScheduleCard data={day} /></View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* 하단 탭바 */}
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

// 배지 전용 스타일
const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});