import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  date: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  registeredTime: string;
  wifiTime: string;
  isPlanned: boolean;
  storeName: string;
}

const WorkerSchedule: React.FC = () => {
  // 컴포넌트 내부 상단
  const [storeId, setStoreId] = useState<number>(1);
  const today = new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [workHistory, setWorkHistory] = useState<WorkData[]>([]);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [breakTime, setBreakTime] = useState("30");
  const [reason, setReason] = useState("");

  const [showRequestMenu, setShowRequestMenu] = useState(false);
  const [requestType, setRequestType] = useState<"수정" | "삭제">("수정");
  const [category, setCategory] = useState<"등록된 근무" | "기록된 근무">(
    "등록된 근무",
  );

  const getPrivateApi = async () => {
    let token = null;

    try {
      if (Platform.OS === "web") {
        token = localStorage.getItem("user_token");
      } else {
        token = await SecureStore.getItemAsync("user_token");
      }
    } catch (e) {
      console.error("토큰 로드 실패", e);
    }
    const privateApi = api;

    // 💡 포인트: 새 인스턴스를 만들지 않고, 기존 api 설정에 토큰만 추가합니다.
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }

    return api;
  };

  const loadUserData = async () => {
    try {
      const storedName = await AsyncStorage.getItem("userName");
      setUserName(storedName || "사용자");
    } catch (e) {
      console.error("이름 로드 실패", e);
    }
  };

  const fetchMonthlySchedule = useCallback(
    async (date: string) => {
      // 1. 가드 로직: storeId가 없거나 0이면 서버 에러가 날 확률이 높으므로 호출하지 않음
      if (!storeId || Number(storeId) === 0) {
        console.warn("유효하지 않은 storeId로 조회를 시도했습니다:", storeId);
        return;
      }

      try {
        setLoading(true);
        const privateApi = await getPrivateApi();
        const [year, month] = date.split("-");

        // 2. 파라미터 구성 (month: "01" 형식 적용)
        const response = await privateApi.get(`/api/v1/schedules/monthly`, {
          params: {
            storeId: Number(storeId),
            year: year,
            month: month.padStart(2, "0"),
          },
        });

        // 3. 데이터 매핑
        const dataList = response.data.data || response.data || [];

        // 서버 응답이 배열이 아닐 경우를 대비한 안전장치
        if (!Array.isArray(dataList)) {
          console.error("서버 응답 형식이 배열이 아닙니다:", dataList);
          setWorkHistory([]);
          return;
        }

        const mappedData = dataList.map((item: any, index: number) => ({
          id: item.scheduleId ? `schedule-${item.scheduleId}` : `temp-${index}`,
          date: item.date,
          startTime: item.time?.split("~")[0] || "09:00",
          endTime: item.time?.split("~")[1] || "18:00",
          registeredTime: item.time || "",
          wifiTime: "",
          isPlanned: new Date(item.date) > new Date(today),
          storeName: item.name || "매장 정보 없음",
          breakTime: item.breakTime?.toString() || "30",
        }));

        setWorkHistory(mappedData);
      } catch (error: any) {
        // 4. 에러 로그 보강: 500 에러 시 서버가 보낸 메시지를 출력해야 원인 파악이 쉬움
        console.error(
          "조회 실패 상세:",
          error.response?.status,
          error.response?.data, // 서버가 보낸 구체적인 에러 메시지 확인용
        );
        setWorkHistory([]); // 에러 시 기존 목록 초기화
      } finally {
        setLoading(false);
      }
    },
    [storeId],
  ); // storeId가 변경될 때 함수가 갱신되도록 의존성 추가

  useEffect(() => {
    loadUserData();
    fetchMonthlySchedule(selectedDate);
  }, [selectedDate.split("-")[1], fetchMonthlySchedule]);

  const handleSave = async () => {
    if (!startTime || !endTime) {
      Alert.alert("알림", "시간을 입력해주세요.");
      return;
    }
    const payload = {
      storeId: Number(storeId),
      workDate: selectedDate,
      startTime: startTime,
      endTime: endTime,
      breakTime: Number(breakTime),
    };
    try {
      setLoading(true);
      const privateApi = await getPrivateApi();
      const response = await privateApi.post(`/api/v1/schedules`, payload);
      if (response.status === 200 || response.status === 201) {
        Alert.alert("성공", "근무 스케줄이 등록되었습니다.");
        setShowActionModal(false);
        setStartTime("");
        setEndTime("");
        fetchMonthlySchedule(selectedDate);
      }
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || "";
      Alert.alert(
        "등록 실패",
        serverMsg.includes("id must not be null")
          ? "서버에서 사용자 식별(ID)에 실패했습니다. 다시 로그인해 주세요."
          : "이미 등록된 근무가 있거나 서버 내부 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async () => {
    if (!reason) {
      Alert.alert("알림", "사유를 입력해주세요.");
      return;
    }
    const payload = {
      storeId: storeId,
      targetType: category === "등록된 근무" ? "SCHEDULE" : "ATTENDANCE",
      targetId:
        Number(selectedWorkDetail?.id?.toString().replace(/[^0-9]/g, "")) || 0,
      requestType: requestType === "수정" ? "UPDATE" : "DELETE",
      afterValue: `${startTime}~${endTime}`,
      targetDate: selectedDate,
      reason: reason,
    };
    try {
      setLoading(true);
      const privateApi = await getPrivateApi();
      const response = await privateApi.post(`/api/v1/modifications`, payload);
      if (response.status === 200 || response.status === 201) {
        Alert.alert("성공", "정정 요청이 접수되었습니다.");
        setRequestModalVisible(false);
        setReason("");
      }
    } catch (error: any) {
      Alert.alert(
        "요청 실패",
        error.response?.data?.message || "오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ 실시간 입력 가시성을 위한 로직 (입력 즉시 보임)
  const onChangeTime = (text: string, setter: (val: string) => void) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 2) {
      setter(cleaned);
    } else {
      setter(`${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`);
    }
  };

  const selectedWorkDetail = useMemo(
    () => workHistory.find((w) => w.date === selectedDate),
    [workHistory, selectedDate],
  );

  const shiftDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const getBadgeInfo = (dateString: string) => {
    const data = workHistory.find((d) => d.date === dateString);
    if (!data) return null;
    return { label: "근무", color: "#6B4EFF", bgColor: "#F0EBFF" };
  };

  return (
    <View style={styles.container}>
      <Header notificationCount={5} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>근무 시간</Text>
          <View style={styles.iconRow}>
            <TouchableOpacity
              onPress={() => setShowActionModal(true)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="add-circle" size={32} color="#D1C4E9" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowRequestMenu(!showRequestMenu)}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <MaterialCommunityIcons
                name="hands-pray"
                size={28}
                color="#D1C4E9"
              />
            </TouchableOpacity>
          </View>
          {showRequestMenu && (
            <View style={styles.floatingMenu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setRequestType("수정");
                  setRequestModalVisible(true);
                  setShowRequestMenu(false);
                }}
              >
                <Text style={styles.menuText}>수정</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setRequestType("삭제");
                  setRequestModalVisible(true);
                  setShowRequestMenu(false);
                }}
              >
                <Text style={styles.menuText}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.historyCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.columnLabel}>날짜</Text>
            <Text style={styles.columnLabel}>등록 시간</Text>
            <Text style={styles.columnLabel}>기록 시간</Text>
          </View>
          {workHistory.length > 0 ? (
            workHistory
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime(),
              )
              .map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={styles.dateCell}>
                    {item.date.split("-")[1]}월 {item.date.split("-")[2]}일
                  </Text>
                  <Text style={styles.timeCell}>{item.registeredTime}</Text>
                  <Text style={styles.timeCell}>
                    {item.isPlanned ? "-" : item.wifiTime || "-"}
                  </Text>
                </View>
              ))
          ) : (
            <Text style={{ textAlign: "center", padding: 20, color: "#999" }}>
              기록이 없습니다.
            </Text>
          )}
        </View>

        <View style={styles.calendarWrapper}>
          <Calendar
            current={selectedDate}
            onDayPress={(day: any) => {
              setSelectedDate(day.dateString);
              setShowDetailModal(true);
            }}
            renderArrow={(direction) => (
              <Ionicons
                name={direction === "left" ? "chevron-back" : "chevron-forward"}
                size={24}
                color="#E0D5FF"
              />
            )}
            theme={{
              todayTextColor: "#E0D5FF",
              arrowColor: "#E0D5FF",
              calendarBackground: "#F2F2F2",
              textMonthFontWeight: "bold",
            }}
            style={{ borderRadius: 20 }}
            dayComponent={({ date }: any) => {
              const badge = getBadgeInfo(date.dateString);
              const isToday = date.dateString === today;
              return (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedDate(date.dateString);
                    setShowDetailModal(true);
                  }}
                  style={[
                    styles.dayBox,
                    date.dateString === selectedDate && styles.selectedDay,
                    isToday && { backgroundColor: "#E0D5FF", borderRadius: 15 },
                  ]}
                >
                  <Text
                    style={[styles.dayText, isToday && { fontWeight: "bold" }]}
                  >
                    {date.day}
                  </Text>
                  {badge && (
                    <View
                      style={[styles.badge, { backgroundColor: badge.bgColor }]}
                    >
                      <Text style={[styles.badgeText, { color: badge.color }]}>
                        ●
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </ScrollView>

      {/* 근무 등록 모달 */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>근무 등록</Text>
                  <View style={styles.userTag}>
                    <Text style={styles.userTagText}>{userName}</Text>
                  </View>
                </View>
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
                    <View style={styles.inputItem}>
                      <TextInput
                        style={styles.timeInput}
                        value={startTime}
                        onChangeText={(t) => onChangeTime(t, setStartTime)}
                        keyboardType="number-pad"
                        maxLength={5}
                        placeholder="00:00"
                        returnKeyType="done"
                      />
                    </View>
                    <Text style={{ fontSize: 20 }}>~</Text>
                    <View style={styles.inputItem}>
                      <TextInput
                        style={styles.timeInput}
                        value={endTime}
                        onChangeText={(t) => onChangeTime(t, setEndTime)}
                        keyboardType="number-pad"
                        maxLength={5}
                        placeholder="00:00"
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.inputField}>
                  <Text style={styles.inputLabel}>휴게 시간 (분)</Text>
                  <View style={styles.breakTimeGroup}>
                    {["30", "60"].map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.breakTimeBtn,
                          breakTime === t && styles.breakTimeBtnActive,
                        ]}
                        onPress={() => setBreakTime(t)}
                      >
                        <Text style={breakTime === t ? { color: "#fff" } : {}}>
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
                    <Text style={styles.cancelBtnText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSave}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>저장</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* 정정 요청 모달 */}
      <Modal
        visible={requestModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{requestType} 요청하기</Text>
                <View style={styles.userTag}>
                  <Text style={styles.userTagText}>{userName}</Text>
                </View>
              </View>
              <View style={styles.categoryGroup}>
                {["등록된 근무", "기록된 근무"].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryBtn,
                      category === item && styles.categoryBtnActive,
                    ]}
                    onPress={() => setCategory(item as any)}
                  >
                    <Text style={category === item ? { color: "#fff" } : {}}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                <Text style={styles.inputLabel}>
                  {requestType === "수정" ? "변경 시간" : "삭제 대상 시간"}
                </Text>
                <View style={styles.timeInputRow}>
                  <View style={styles.inputItem}>
                    <TextInput
                      style={[
                        styles.timeInput,
                        requestType === "삭제" && {
                          backgroundColor: "#F5F5F5",
                        },
                      ]}
                      value={startTime}
                      onChangeText={(t) => onChangeTime(t, setStartTime)}
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholder="00:00"
                      editable={requestType === "수정"}
                    />
                  </View>
                  <Text style={{ fontSize: 20 }}>~</Text>
                  <View style={styles.inputItem}>
                    <TextInput
                      style={[
                        styles.timeInput,
                        requestType === "삭제" && {
                          backgroundColor: "#F5F5F5",
                        },
                      ]}
                      value={endTime}
                      onChangeText={(t) => onChangeTime(t, setEndTime)}
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholder="00:00"
                      editable={requestType === "수정"}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>사유</Text>
                <TextInput
                  style={styles.reasonInput}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="사유를 입력해주세요"
                  multiline
                />
              </View>
              <View style={styles.modalBtnGroup}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setRequestModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleRequestSubmit}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>요청 보내기</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 상세 모달 */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              <TouchableOpacity
                onPress={() => shiftDate(-1)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedDate.split("-")[1]}월 {selectedDate.split("-")[2]}일
                근무
              </Text>
              <TouchableOpacity
                onPress={() => shiftDate(1)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-forward" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.detailInfoBox}>
              <Text style={styles.storeName}>
                {selectedWorkDetail
                  ? selectedWorkDetail.storeName
                  : "매장 정보 없음"}
              </Text>
              {selectedWorkDetail && (
                <>
                  <Text style={styles.detailTimeText}>
                    {selectedWorkDetail.startTime} ~{" "}
                    {selectedWorkDetail.endTime}
                  </Text>
                  <Text style={styles.detailSubText}>
                    (휴게시간: {selectedWorkDetail.breakTime}분)
                  </Text>
                </>
              )}
            </View>
            <View style={styles.modalBtnGroup}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={styles.cancelBtnText}>뒤로 가기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => {
                  setShowDetailModal(false);
                  setShowActionModal(true);
                }}
              >
                <Text style={styles.submitBtnText}>근무 추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    </View>
  );
};

export default WorkerSchedule;
