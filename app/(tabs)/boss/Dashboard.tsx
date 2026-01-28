import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScheduleCard, TabItem, WorkerCard } from '../../../components/dashboard/BossDashboard';
import { SCHEDULES, WORKERS } from '../../../components/dashboard/Data';
import { styles } from '../../../styles/tabs/boss/Dashboard';


// 타입 정의
interface TodoItem {
  id: number;
  text: string;
  isCompleted: boolean;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [todoText, setTodoText] = useState('');
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  
  // 알림 개수 (실제로는 서버에서 받아오거나 다른 state management 사용)
  const [notificationCount, setNotificationCount] = useState(3); // 예시: 3개의 알림

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync('135155');
    Alert.alert('알림', '초대 코드가 복사되었습니다.');
  };

  const addTodo = () => {
    if (todoText.trim() === '') {
      Alert.alert('알림', '할 일을 입력해주세요.');
      return;
    }
    const newTodo: TodoItem = {
      id: Date.now(),
      text: todoText,
      isCompleted: false,
    };
    setTodoList([...todoList, newTodo]);
    setTodoText('');
  };

  const toggleTodo = (id: number) => {
    setTodoList(
      todoList.map((item) =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      )
    );
  };

  const deleteTodo = (id: number) => {
    Alert.alert('삭제', '이 할 일을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', onPress: () => setTodoList(todoList.filter(item => item.id !== id)) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 헤더 */}
        <View style={styles.header}>
          <Image source={require('../../../assets/images/logo.png')} style={{ width: 90, height: 70 }} resizeMode="contain" />
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => router.push('./(tabs)/boss/Notification')}
            style={{ position: 'relative' }}
          >
            <Ionicons name="notifications" size={24} color="#D1C4E9" />
            {/* 알림 badge */}
            {notificationCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -4,
                right: -4,
                backgroundColor: '#FF4444',
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 'bold',
                }}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 초대 코드 */}
        <View style={styles.inviteRow}>
          <TouchableOpacity style={styles.inviteCodeBadge} onPress={copyToClipboard} activeOpacity={0.7}>
            <Text style={styles.inviteText}>
              초대 코드 <Text style={styles.purpleText}>135155</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualButton} activeOpacity={0.7}>
            <Text style={styles.manualButtonText}>매뉴얼 등록하기</Text>
          </TouchableOpacity>
        </View>
        
        {/* 인건비 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>인건비 및 근무 현황</Text>
          <Text style={styles.dateText}>정산일   2026.01.05</Text>
          <View style={styles.costContainer}>
            <Text style={styles.costAmount}>4,250,000</Text>
            <Text style={styles.costDesc}>
              전월 대비 <Text style={styles.redText}>+ 5%</Text> 증가했습니다.
            </Text>
          </View>
        </View>

        {/* 현재 근무 중 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>현재 근무 중</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>3명</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {WORKERS.map((worker) => (
              <View key={worker.id} style={{ marginRight: 15}}>
                <WorkerCard data={worker} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* To Do List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 To Do List</Text>
          
          {todoList.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#AFAFAF', fontSize: 15 }}>
                오늘의 할 일을 작성해주세요 ✏️
              </Text>
            </View>
          ) : (
            todoList.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.todoItem} 
                activeOpacity={0.8}
                onPress={() => toggleTodo(item.id)}
                onLongPress={() => deleteTodo(item.id)}
              >
                <View style={[
                  styles.checkbox, 
                  item.isCompleted && { backgroundColor: '#000', borderColor: '#000', alignItems: 'center', justifyContent: 'center' }
                ]}>
                  {item.isCompleted && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={[
                  styles.todoText, 
                  item.isCompleted && { textDecorationLine: 'line-through', color: '#AFAFAF' }
                ]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))
          )}
          
          {/* 입력창 */}
          <View style={styles.inputContainer}>
            <TextInput 
              value={todoText}
              onChangeText={setTodoText}
              placeholder="오늘의 할 일을 입력해주세요" 
              style={styles.input}
              placeholderTextColor="#000"
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {SCHEDULES.map((day, idx) => (
              <View key={idx} style={{ marginRight: 12 }}>
                <ScheduleCard data={day} />
              </View>
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