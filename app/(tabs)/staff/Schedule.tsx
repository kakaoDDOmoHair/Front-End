import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import api from "../../../constants/api";

import { Calendar } from "react-native-calendars";
import CustomDatePicker from "../../../components/common/CustomDatePicker";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { styles } from "../../../styles/tabs/staff/Schedule";

interface WorkData {
  id: string;
  originalId: number;
  date: string;
  startTime: string;
  endTime: string;
  breakTime: number; // 계산을 위해 숫자로 관리
  registeredTime: string;
  wifiTime: string;
  isPlanned: boolean;
  storeName: string;
  storeId: number;
}

const WorkerSchedule: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [userStoreName, setUserStoreName] = useState("");
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [workHistory, setWorkHistory] = useState<WorkData[]>([]);

  const [selectedDate, setSelectedDate] = useState(today);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakTime, setBreakTime] = useState<number>(30); // 기본값 30분

  const [showRequestMenu, setShowRequestMenu] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestType, setRequestType] = useState<"수정" | "삭제">("수정");

  const selectedWorkDetail = workHistory.find((w) => w.date === selectedDate);

  const shiftDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const getAuthHeader = async () => {
    let token = null;
    try {
      if (Platform.OS === "web") token = localStorage.getItem("user_token");
      else {
        token = await SecureStore.getItemAsync("user_token");
        if (!token) token = await AsyncStorage.getItem("user_token");
      }
    } catch (e) {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // --- 데이터 로드: 백엔드 DTO(MyWeeklyResponse)와 매핑 ---
  const fetchMyScheduleData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const storedUsername = await AsyncStorage.getItem("username");

      const profileRes = await api.get(`/api/v1/users/me`, {
        params: storedUsername ? { username: storedUsername } : {},
        headers,
      });

      const userData = profileRes.data.data || profileRes.data;
      if (userData) {
        setUserName(userData.name);
        setUserId(userData.userId || userData.id);
        setCurrentStoreId(userData.storeId);
        if (userData.storeName) setUserStoreName(userData.storeName);
      }

      const scheduleRes = await api.get(`/api/v1/schedules/my-weekly`, {
        params: { username: userData?.username || storedUsername },
        headers,
      });

      const dataList = scheduleRes.data || [];
      const storedStoreName = await AsyncStorage.getItem("storeName");

      const mappedData: WorkData[] = dataList.map(
        (item: any, index: number) => {
          const isPast = item.date < today;
          return {
            id: item.scheduleId
              ? `id-${item.scheduleId}`
              : `idx-${index}-${item.date}`,
            originalId: item.scheduleId,
            date: item.date,
            startTime: item.startTime || "00:00",
            endTime: item.endTime || "00:00",
            registeredTime: `${item.startTime || "00:00"}~${item.endTime || "00:00"}`,
            wifiTime: item.actualTime || "",
            isPlanned: !isPast,
            storeName: item.storeName || item.storeN || storedStoreName,
            storeId: item.storeId,
            // 🌟 백엔드에서 주는 breakTime(Integer/String)을 안전하게 숫자로 변환
            breakTime: Number(item.breakTime || 0),
          };
        },
      );

      setWorkHistory(
        mappedData.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      );
    } catch (error) {
      console.error("데이터 로드 실패", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyScheduleData();
  }, []);

  // --- 🌟 배지 정보 계산 (휴게 시간 차감) ---
  const getBadgeInfo = (dateString: string) => {
    const data = workHistory.find((d) => d.date === dateString);
    if (!data) return null;

    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);

    const totalMinutes = endH * 60 + endM - (startH * 60 + startM);
    // 🌟 실제 저장된 휴게 시간을 뺌
    const actualWorkMinutes = totalMinutes - data.breakTime;

    const finalMinutes = actualWorkMinutes > 0 ? actualWorkMinutes : 0;
    const h = Math.floor(finalMinutes / 60);
    const m = finalMinutes % 60;

    let color = "#6B4EFF";
    let bgColor = "#F0EBFF";
    if (data.isPlanned) {
      color = "#4A90E2";
      bgColor = "#E1F0FF";
    }

    return { label: `${h}h${m > 0 ? ` ${m}m` : ""}`, color, bgColor };
  };

  const formatTime = (text: string, setter: (val: string) => void) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length >= 3)
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    setter(formatted.slice(0, 5));
  };

  // --- 🌟 근무 등록 핸들러 (Payload를 String으로 변환) ---
  const handleSave = async () => {
    if (!startTime || !endTime) {
      Alert.alert("알림", "시간을 입력해주세요.");
      return;
    }
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const storedUsername = await AsyncStorage.getItem("username");

      const payload = {
        userId: userId,
        username: storedUsername,
        workDate: selectedDate,
        startTime: startTime, // "09:00"
        endTime: endTime, // "18:00"
        breakTime: String(breakTime), // 🌟 백엔드 규격에 맞춰 String으로 변환
        storeId: currentStoreId,
      };

      const res = await api.post(`/api/v1/schedules`, payload, { headers });
      if (res.status === 200 || res.status === 201) {
        Alert.alert("성공", "근무가 등록되었습니다.");
        setShowActionModal(false);
        setStartTime("");
        setEndTime("");
        fetchMyScheduleData();
      }
    } catch (error) {
      Alert.alert("실패", "서버 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header notificationCount={5} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>근무 시간</Text>
          <View style={styles.iconRow}>
            <TouchableOpacity onPress={() => setShowActionModal(true)}>
              <Ionicons name="add-circle" size={32} color="#D1C4E9" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowRequestMenu(!showRequestMenu)}
            >
              <MaterialCommunityIcons
                name="hands-pray"
                size={28}
                color="#D1C4E9"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 상단 간략 히스토리 */}
        <View style={styles.historyCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.columnLabel}>날짜</Text>
            <Text style={styles.columnLabel}>등록 시간</Text>
            <Text style={styles.columnLabel}>기록 시간</Text>
          </View>
          {workHistory.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.dateCell}>
                {item.date.split("-")[1]}월 {item.date.split("-")[2]}일
              </Text>
              <Text style={styles.timeCell}>{item.registeredTime}</Text>
              <Text
                style={[
                  styles.timeCell,
                  { color: getBadgeInfo(item.date)?.color },
                ]}
              >
                {item.isPlanned ? "-" : item.wifiTime || "-"}
              </Text>
            </View>
          ))}
        </View>

        {/* 캘린더 영역 */}
        <View style={styles.calendarWrapper}>
          <Calendar
            current={selectedDate}
            theme={{
              calendarBackground: "#F2F2F2",
              todayTextColor: "#6B4EFF",
              arrowColor: "#6B4EFF",
            }}
            dayComponent={({ date }: any) => {
              const badge = getBadgeInfo(date.dateString);
              const isToday = date.dateString === today;
              const isSelected = date.dateString === selectedDate;

              return (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(date.dateString);
                    setShowDetailModal(true);
                  }}
                  style={[
                    styles.dayBox,
                    isSelected && styles.selectedDay,
                    isToday && {
                      borderBottomWidth: 2,
                      borderBottomColor: "#6B4EFF",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && { color: "#FFF", fontWeight: "bold" },
                    ]}
                  >
                    {date.day}
                  </Text>
                  {badge && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isSelected
                            ? "rgba(255,255,255,0.3)"
                            : badge.bgColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color: isSelected ? "#FFF" : badge.color,
                            fontSize: 8,
                          },
                        ]}
                      >
                        {badge.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </ScrollView>

      {/* 1. 상세 정보 모달 */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => shiftDate(-1)}>
                <Ionicons name="chevron-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedDate.split("-")[1]}월 {selectedDate.split("-")[2]}일
                근무
              </Text>
              <TouchableOpacity onPress={() => shiftDate(1)}>
                <Ionicons name="chevron-forward" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.detailInfoBox}>
              <Text style={styles.storeName}>
                {selectedWorkDetail?.storeName || userStoreName}
              </Text>
              {selectedWorkDetail ? (
                <>
                  <Text style={styles.detailTimeText}>
                    {selectedWorkDetail.startTime} ~{" "}
                    {selectedWorkDetail.endTime}
                  </Text>
                  <Text style={styles.detailSubText}>
                    (휴게시간: {selectedWorkDetail.breakTime}분)
                  </Text>
                </>
              ) : (
                <Text style={styles.noWorkText}>근무 기록이 없습니다.</Text>
              )}
            </View>
            <View style={styles.modalBtnGroup}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDetailModal(false)}
              >
                <Text>뒤로 가기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  setShowActionModal(true);
                }}
              >
                <Text style={{ color: "#fff" }}>근무 추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. 근무 등록 모달 */}
      <Modal visible={showActionModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>근무 등록</Text>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>날짜</Text>
                <TouchableOpacity
                  style={styles.dateInputBox}
                  onPress={() => setShowCalendar(true)}
                >
                  <Text>{selectedDate}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#AAA" />
                </TouchableOpacity>
              </View>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>근무 시간</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    value={startTime}
                    onChangeText={(t) => formatTime(t, setStartTime)}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder="09:00"
                  />
                  <Text>~</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={endTime}
                    onChangeText={(t) => formatTime(t, setEndTime)}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder="18:00"
                  />
                </View>
              </View>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>휴게 시간 (분)</Text>
                <View style={styles.breakTimeGroup}>
                  {[0, 30, 60].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.breakTimeBtn,
                        breakTime === t && styles.breakTimeBtnActive,
                      ]}
                      onPress={() => setBreakTime(t)}
                    >
                      <Text
                        style={[
                          styles.breakTimeText,
                          breakTime === t && styles.breakTimeTextActive,
                        ]}
                      >
                        {t}분
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.modalBtnGroup}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowActionModal(false)}
                >
                  <Text>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
                  <Text style={{ color: "#fff" }}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <CustomDatePicker
        visible={showCalendar}
        value={selectedDate}
        onDateChange={(d: string) => {
          setSelectedDate(d);
          setShowCalendar(false);
        }}
        onClose={() => setShowCalendar(false)}
      />
      <Footer />
    </SafeAreaView>
  );
};

export default WorkerSchedule;
