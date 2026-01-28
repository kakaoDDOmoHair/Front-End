import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import CustomDatePicker from "../../../components/common/CustomDatePicker";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { styles } from "../../../styles/tabs/boss/Schedule";

interface Attendance {
  id: number;
  name: string;
  date: string;
  time: string;
  breakTime: string;
  status: "active" | "late" | "absent" | "none";
  isPlanned: boolean;
}

const AttendancePage: React.FC = () => {
  // --- 상태 관리 ---
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEditCalendar, setShowEditCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2026-01-20");
  const [breakTime, setBreakTime] = useState("30"); // 초기값 설정

  const [manualData, setManualData] = useState<Attendance[]>([
    {
      id: 1,
      name: "Jun",
      date: "2026-01-20",
      time: "12:00 ~ 18:00",
      breakTime: "30분",
      status: "active",
      isPlanned: false,
    },
    {
      id: 2,
      name: "Hong",
      date: "2026-01-20",
      time: "12:05 ~ 18:00",
      breakTime: "60분",
      status: "late",
      isPlanned: false,
    },
    {
      id: 3,
      name: "Crong",
      date: "2026-01-20",
      time: "결근",
      breakTime: "0분",
      status: "absent",
      isPlanned: false,
    },
    {
      id: 4,
      name: "Annie",
      date: "2026-01-21",
      time: "09:00 ~ 15:00",
      breakTime: "30분",
      status: "none",
      isPlanned: true,
    },
  ]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Attendance | null>(null);
  const [editForm, setEditForm] = useState({
    date: "2026-01-20",
    start: "12:00",
    end: "18:00",
    breakTime: "30",
    isPlanned: false,
  });

  // --- 로직 ---
  const weekDays = useMemo(() => {
    const current = new Date(selectedDate);
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - current.getDay());
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
      (label, index) => {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + index);
        return {
          label,
          dateString: date.toISOString().split("T")[0],
          dayNum: date.getDate(),
        };
      },
    );
  }, [selectedDate]);

  const handleEditPress = (user: Attendance) => {
    setSelectedUser(user);
    const times = user.time.includes("~")
      ? user.time.split(" ~ ")
      : ["12:00", "18:00"];
    const bTime = user.breakTime.replace("분", "");
    setEditForm({
      date: user.date,
      start: times[0].trim(),
      end: times[1]?.trim() || "18:00",
      breakTime: bTime,
      isPlanned: user.isPlanned,
    });
    setBreakTime(bTime);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    const updatedData = manualData.map((item) =>
      item.id === selectedUser.id
        ? {
            ...item,
            date: editForm.date,
            time: `${editForm.start} ~ ${editForm.end}`,
            breakTime: `${editForm.breakTime}분`,
            isPlanned: editForm.isPlanned,
            status:
              item.isPlanned && !editForm.isPlanned ? "active" : item.status,
          }
        : item,
    );
    setManualData(updatedData);
    setShowEditModal(false);
  };

  return (
    <View style={styles.container}>
      <Header notificationCount={5} />

      {/* 1. 메인 스크롤 뷰: contentContainerStyle에 패딩을 넉넉히 주어 푸터에 가리지 않게 함 */}
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>아르바이트생 출퇴근 기록 확인</Text>
        <View style={styles.sectionCard}>
          {manualData.map((item) => (
            <View key={item.id} style={styles.infoRow}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      item.status === "active"
                        ? "#4ADE80"
                        : item.status === "late"
                          ? "#FACC15"
                          : "#FB7185",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>근무 수정</Text>
          <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)}>
            <Ionicons
              name={showCalendar ? "calendar" : "calendar-outline"}
              size={22}
              color="#A28BFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.daysHeader}>
            {weekDays.map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => setSelectedDate(item.dateString)}
                style={{ alignItems: "center" }}
              >
                <Text
                  style={
                    item.dateString === selectedDate
                      ? styles.dayTextActive
                      : styles.dayText
                  }
                >
                  {item.label}
                </Text>
                <Text
                  style={
                    item.dateString === selectedDate
                      ? styles.dayTextActive
                      : { color: "#333", fontSize: 14, fontWeight: "600" }
                  }
                >
                  {item.dayNum}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {manualData.map((item) => (
            <View key={item.id} style={styles.infoRow}>
              <TouchableOpacity
                style={styles.nameBadge}
                onPress={() => handleEditPress(item)}
              >
                <Text style={styles.nameBadgeText}>{item.name}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      item.status === "active"
                        ? "#4ADE80"
                        : item.status === "late"
                          ? "#FACC15"
                          : "#FB7185",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {showCalendar && (
          <View style={styles.fixedContainer}>
            <View style={styles.header}>
              <Text style={styles.headerText}>날짜 선택</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>
            <CustomDatePicker
              visible={true}
              value={selectedDate}
              onDateChange={(d: string) => {
                setSelectedDate(d);
                setShowCalendar(false);
              }}
              onClose={() => setShowCalendar(false)}
            />
          </View>
        )}
      </ScrollView>

      {/* 2. 근무 수정 모달: 내부 ScrollView 추가 */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* 상단 헤더 */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedUser?.name} 근무 수정
                </Text>
                <View style={styles.userTag}>
                  <Text style={styles.userTagText}>JUN</Text>
                </View>
              </View>

              {/* 1. 카테고리 탭 */}
              <View style={styles.categoryGroup}>
                <TouchableOpacity
                  style={[
                    styles.categoryBtn,
                    !editForm.isPlanned && styles.categoryBtnActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, isPlanned: false })}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      !editForm.isPlanned && styles.categoryTextActive,
                    ]}
                  >
                    등록된 근무
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryBtn,
                    editForm.isPlanned && styles.categoryBtnActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, isPlanned: true })}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      editForm.isPlanned && styles.categoryTextActive,
                    ]}
                  >
                    기록될 근무
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 2. 근무 일자 */}
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>근무 일자</Text>
                <TouchableOpacity
                  style={styles.dateInputBox}
                  onPress={() => setShowEditCalendar(true)}
                >
                  <Text style={{ color: "#333" }}>{editForm.date}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#A28BFF" />
                </TouchableOpacity>
              </View>

              {/* 3. 근무 시간 */}
              <View style={styles.inputField}>
                <Text style={styles.inputLabel}>근무 시간</Text>
                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputItem}>
                    <TextInput
                      style={styles.timeInput}
                      value={editForm.start}
                      onChangeText={(t) =>
                        setEditForm({ ...editForm, start: t })
                      }
                      keyboardType="number-pad"
                    />
                  </View>
                  <Text style={{ marginHorizontal: 10, color: "#999" }}>~</Text>
                  <View style={styles.timeInputItem}>
                    <TextInput
                      style={styles.timeInput}
                      value={editForm.end}
                      onChangeText={(t) => setEditForm({ ...editForm, end: t })}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>

              {/* 4. 휴게 시간 (버튼 형태) */}
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
                      onPress={() => {
                        setBreakTime(t);
                        setEditForm({ ...editForm, breakTime: t });
                      }}
                    >
                      <Text
                        style={
                          breakTime === t
                            ? { color: "white" }
                            : { color: "#333" }
                        }
                      >
                        {t}분
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 하단 버튼 */}
              <View style={styles.modalBtnGroup}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.submitBtnText}>수정 완료</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 날짜 선택 중앙 팝업 */}
      <Modal visible={showEditCalendar} transparent animationType="fade">
        <View style={styles.centerOverlay}>
          <View style={styles.centerModalContainer}>
            <View style={styles.header}>
              <Text style={{ fontSize: 16, fontWeight: "bold", padding: 15 }}>
                근무 일자 선택
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditCalendar(false)}
                style={{ padding: 15 }}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: 10, paddingBottom: 20 }}>
              <CustomDatePicker
                visible={true}
                value={editForm.date}
                onDateChange={(d: string) => {
                  setEditForm({ ...editForm, date: d });
                  setShowEditCalendar(false);
                }}
                onClose={() => setShowEditCalendar(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Footer />
    </View>
  );
};
export default AttendancePage;
