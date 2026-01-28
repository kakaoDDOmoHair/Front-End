import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
    Alert,
    AppState,
    Linking,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { styles } from "../../../styles/tabs/boss/Pay";

// --- [1] 백엔드 연동 전까지 사용할 초기 더미 데이터 ---
const DUMMY_SALARY_DATA: Record<string, any> = {
  Jun: {
    email: "jun@paymate.com",
    amount: "531,200",
    account: "123-456-789012",
    bank: "카카오뱅크",
    history: [
      { year: "2025", month: "11", amount: "480,000" },
      { year: "2025", month: "12", amount: "510,000" },
    ],
  },
  Crong: {
    email: "crong@paymate.com",
    amount: "420,000",
    account: "987-654-321098",
    bank: "국민은행",
    history: [{ year: "2025", month: "12", amount: "420,000" }],
  },
};

const Pay: React.FC = () => {
  const [selectedStaff, setSelectedStaff] = useState<string>("Jun");
  const [salaryInfo, setSalaryInfo] = useState(DUMMY_SALARY_DATA["Jun"]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // ✨ 정산 완료 모달 상태
  const [isTransferring, setIsTransferring] = useState(false); // ✨ 송금 프로세스 진행 여부 플래그

  // ✨ 현재 날짜 기준 귀속월(전달) 자동 계산
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  // ✨ [앱 상태 감지] 뱅킹 앱에서 돌아올 때 성공 모달을 띄우는 로직
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // 월급 정산 버튼을 눌러 송금 중인 상태에서 앱이 다시 활성화(active) 되었을 때
      if (isTransferring && nextAppState === "active") {
        setIsTransferring(false);
        setShowSuccessModal(true); // "정산이 완료되었습니다" 모달 노출
      }
    });

    return () => subscription.remove();
  }, [isTransferring]);

  useEffect(() => {
    setSalaryInfo(DUMMY_SALARY_DATA[selectedStaff]);
  }, [selectedStaff]);

  // --- [2] 백엔드 API 연동 함수 (템플릿) ---
  const fetchSalaryList = async () => {
    /* API 연동 로직 */
  };
  const sendPayslipEmail = async (paymentId: number) => {
    Alert.alert("알림", `${selectedStaff}님께 명세서가 발송되었습니다.`);
  };
  const downloadExcel = async () => {
    Alert.alert("알림", "세무사용 엑셀 파일 다운로드를 시작합니다.");
  };

  // ✨ [핵심 기능] 월급 정산 클릭 시 계좌 복사 및 모달 띄우기
  const handleTransfer = async () => {
    await Clipboard.setStringAsync(salaryInfo.account);
    setShowCopyModal(true);
  };

  const openBankApp = () => {
    setShowCopyModal(false);
    setIsTransferring(true); // ✨ 송금 상태 시작 표시
    Linking.openURL("kakaobank://").catch(() => {
      setIsTransferring(false);
      Alert.alert("알림", "뱅킹 앱이 설치되어 있지 않습니다.");
    });
  };

  return (
    <View style={styles.container}>
      <Header notificationCount={3} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 알바생 선택 탭 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.staffTabRow}
        >
          {Object.keys(DUMMY_SALARY_DATA).map((name) => (
            <TouchableOpacity
              key={name}
              style={[
                styles.staffTab,
                selectedStaff === name && styles.staffTabActive,
              ]}
              onPress={() => setSelectedStaff(name)}
            >
              <Text style={styles.staffTabText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.mainTitle}>급여 이체</Text>
        <View style={styles.salaryCard}>
          {salaryInfo.history.map((item: any, idx: number) => {
            const isNewYear =
              idx === 0 || salaryInfo.history[idx - 1].year !== item.year;
            return (
              <View key={idx}>
                {isNewYear && (
                  <View style={styles.yearHeaderRow}>
                    <Text style={styles.yearLabelText}>{item.year}년</Text>
                    <View style={styles.yearLine} />
                  </View>
                )}
                <View style={styles.salaryRow}>
                  <View style={styles.rowItemLeft}>
                    <Text style={styles.historyMonthText}>
                      {item.month}월 월급
                    </Text>
                  </View>
                  <View style={styles.rowItemCenter}>
                    <Text style={styles.historyAmountText}>
                      {item.amount}원
                    </Text>
                  </View>
                  <View style={styles.rowItemRight}>
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>정산 완료</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.thinDivider} />
              </View>
            );
          })}

          {(salaryInfo.history.length === 0 ||
            salaryInfo.history[salaryInfo.history.length - 1].year !==
              currentYear.toString()) && (
            <View style={[styles.yearHeaderRow, { marginTop: 10 }]}>
              <Text style={styles.yearLabelText}>{currentYear}년</Text>
              <View style={styles.yearLine} />
            </View>
          )}

          <View style={styles.salaryRow}>
            <View style={styles.rowItemLeft}>
              <Text style={styles.monthText}>{currentMonth}월 월급</Text>
            </View>
            <View style={styles.rowItemCenter}>
              <Text style={styles.amountText}>{salaryInfo.amount}원</Text>
            </View>
            <View style={styles.rowItemRight}>
              <TouchableOpacity style={styles.calcBtn} onPress={handleTransfer}>
                <Text style={styles.calcBtnText}>월급 정산</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.mainTitle}>임금명세서</Text>
        <View style={styles.toolRow}>
          <TouchableOpacity style={styles.toolBtn} onPress={downloadExcel}>
            <Text style={styles.toolBtnText}>세무사 엑셀 파일</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => setShowPreviewModal(true)}
          >
            <Text style={styles.toolBtnText}>명세서 미리보기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() => sendPayslipEmail(salaryInfo.paymentId)}
          >
            <Text style={styles.toolBtnText}>명세서 발송</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ✨ [1] 슬라이드업 미리보기 모달 */}
      <Modal visible={showPreviewModal} transparent animationType="slide">
        <View style={styles.bottomModalOverlay}>
          <View style={styles.previewModalContent}>
            <Text style={styles.previewTitle}>임금명세서 미리보기</Text>
            <View style={styles.previewBox}>
              <Text style={styles.previewPlaceholder}>
                {targetYear}년 {targetMonth}월 명세서
              </Text>
            </View>
            <View style={styles.previewBtnGroup}>
              <TouchableOpacity
                style={styles.previewCloseBtn}
                onPress={() => setShowPreviewModal(false)}
              >
                <Text style={styles.previewCloseBtnText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.previewDownloadBtn}>
                <Text style={styles.previewDownloadBtnText}>사본 다운로드</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✨ [2] 계좌 복사 안내 모달 */}
      <Modal visible={showCopyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.copyModalContent}>
            <Text style={styles.modalTitleLarge}>
              계좌번호가 복사되었습니다.
            </Text>
            <Text style={styles.modalSubTitle}>
              {salaryInfo.bank} {salaryInfo.account}
            </Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={openBankApp}
            >
              <Text style={styles.modalConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✨ [3] 정산 완료 확인 모달 (뱅킹 앱에서 돌아올 때 노출) */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.copyModalContent}>
            <Text style={styles.modalTitleLarge}>정산이 완료되었습니다.</Text>
            <Text style={styles.modalSubTitle}>
              {selectedStaff}님께 입금 알림 푸시를 보냈습니다.
            </Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Footer />
    </View>
  );
};

export default Pay;
