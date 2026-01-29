import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import api from "../../../constants/api";
import { styles } from "../../../styles/tabs/boss/Pay";

type SalaryStatus = "WAITING" | "REQUESTED" | "COMPLETED" | string;

interface MonthlyWorker {
  name: string;
  amount: number;
  status: SalaryStatus;
  userId: number;
  accountId?: number | null;
  paymentId?: number | null;
  [key: string]: any;
}

interface EstimatedSalary {
  period: string;
  amount: number;
  totalHours: number;
  baseSalary: number;
  weeklyAllowance: number;
  tax: number;
}

const Pay: React.FC = () => {
  // --- [상태 관리] ---
  const [workerList, setWorkerList] = useState<MonthlyWorker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<MonthlyWorker | null>(
    null,
  );
  const [salaryHistory, setSalaryHistory] = useState<MonthlyWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [previewHtml, setPreviewHtml] = useState("");
  const [activeTransferItem, setActiveTransferItem] = useState<any>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [estimatedSalary, setEstimatedSalary] =
    useState<EstimatedSalary | null>(null);
  const [estimatedLoading, setEstimatedLoading] = useState(false);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // --- [1. 초기 데이터 로드] ---
  const loadInitialData = async (
    keepSelectedUserId?: number,
  ): Promise<MonthlyWorker[]> => {
    try {
      setLoading(true);
      const storedStoreId = await AsyncStorage.getItem("storeId");
      if (!storedStoreId) return [];

      const response = await api.get("/api/v1/salary/monthly", {
        params: {
          storeId: Number(storedStoreId),
          year: currentYear,
          month: currentMonth,
        },
      });

      const dataRoot = response.data.data || response.data;
      const finalWorkers = dataRoot.payments || dataRoot.workers || [];
      const totalAmount = dataRoot.totalAmount ?? 0;
      const employeeCount = dataRoot.employeeCount ?? finalWorkers.length;

      console.log("📋 [salary/monthly]", {
        totalAmount,
        employeeCount,
        payments: finalWorkers,
      });
      finalWorkers.forEach((w: any, i: number) => {
        console.log(
          `📋 [${i}] ${w.name} status=${w.status} paymentId=${w.paymentId} accountId=${w.accountId}`,
        );
      });
      setWorkerList(finalWorkers);

      if (finalWorkers.length > 0) {
        const kept = keepSelectedUserId
          ? finalWorkers.find(
              (w: any) => Number(w.userId) === Number(keepSelectedUserId),
            )
          : null;
        setSelectedWorker(kept ?? finalWorkers[0]);
      }
      return finalWorkers;
    } catch (error) {
      console.error("❌ 초기 로드 실패:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      displayWorkerInfo(selectedWorker);
    }
  }, [selectedWorker]);

  // 예상 급여 조회: paymentId가 null일 때만 GET /api/v1/salary/estimated 호출
  const fetchEstimatedSalary = async (userId: number) => {
    try {
      setEstimatedLoading(true);
      setEstimatedSalary(null);
      const storedStoreId = await AsyncStorage.getItem("storeId");
      if (!storedStoreId) return;

      const res = await api.get("/api/v1/salary/estimated", {
        params: {
          storeId: Number(storedStoreId),
          userId,
          year: currentYear,
          month: currentMonth,
        },
      });
      const data = res.data?.data ?? res.data;
      setEstimatedSalary(data as EstimatedSalary);
    } catch (e) {
      console.warn("📋 예상 급여 조회 실패:", e);
      setEstimatedSalary(null);
    } finally {
      setEstimatedLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedWorker) {
      setEstimatedSalary(null);
      return;
    }
    if (selectedWorker.paymentId != null) {
      setEstimatedSalary(null);
      return;
    }
    fetchEstimatedSalary(selectedWorker.userId);
  }, [selectedWorker?.userId, selectedWorker?.paymentId]);

  const displayWorkerInfo = (worker: any) => {
    setSalaryHistory([
      {
        ...worker,
        month: currentMonth,
        totalAmount: worker.amount || 0,
        account: worker.account || "계좌 정보 없음",
        bank: worker.bank || "",
      },
    ]);
  };

  // --- [2. 계좌 상세 정보 조회 API (복호화용)] ---
  // 계좌 "연결"은 알바생 매장 등록 시 계좌 인증에서 이미 됨. 여기서는
  // paymentId 기준 복호화된 계좌번호(실계좌) 조회 → 클립보드 복사 / 모달 표시용.
  const fetchAccountInfo = async (paymentId: number) => {
    try {
      console.log(
        `🔍 계좌 상세 조회 (복호화) paymentId=${paymentId} → GET /api/v1/salary/${paymentId}/account`,
      );
      const response = await api.get(`/api/v1/salary/${paymentId}/account`);
      const data = response.data.data || response.data;
      console.log("🔍 계좌 조회 결과", {
        holder: data?.holder,
        bank: data?.bank,
        accountMask: data?.account ? "***" : null,
      });
      return data;
    } catch (error) {
      console.error("❌ 계좌 정보 로드 실패:", error);
      return null;
    }
  };

  // --- [3. 이체 클릭 핸들러 (복사 및 모달)] ---
  const handleTransferClick = async (item: any) => {
    const paymentId = item.paymentId || item.id;
    if (!paymentId) {
      Alert.alert("알림", "정산 정보(ID)를 찾을 수 없습니다.");
      return;
    }

    setDetailLoading(true);
    const accountData = await fetchAccountInfo(paymentId);

    if (accountData) {
      // 복호화된 진짜 계좌번호를 클립보드에 복사
      await Clipboard.setStringAsync(accountData.account);

      setActiveTransferItem({
        ...item,
        bank: accountData.bank,
        account: accountData.account,
        holder: accountData.holder,
      });
      setShowCopyModal(true);
    } else {
      Alert.alert("오류", "상세 계좌 정보를 불러올 수 없습니다.");
    }
    setDetailLoading(false);
  };

  // --- [4. 급여 정산 실행] ---
  // execute → WAITING 상태로 정산 내역만 생성 (입금 처리 안 함).
  // "정산 완료" 메시지·계좌 모달은 completeTransfer(정산 완료 처리 시)에서만.
  const handleExecuteSalary = async (worker: any) => {
    try {
      setDetailLoading(true);
      const storedStoreId = await AsyncStorage.getItem("storeId");
      const accountId = worker.accountId ? Number(worker.accountId) : null;

      const res = await api.post("/api/v1/salary/execute", {
        storeId: Number(storedStoreId),
        userId: Number(worker.userId || worker.id),
        accountId,
        year: currentYear,
        month: currentMonth,
      });
      const data = res.data?.data ?? res.data;
      const message =
        data?.message ||
        "[정산 내역 생성] 알바생의 급여 정산 내역이 생성되었습니다.";

      await loadInitialData(worker.userId);
      Alert.alert("알림", message);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || "정산 처리 중 오류가 발생했습니다.";
      Alert.alert("알림", errorMsg);
    } finally {
      setDetailLoading(false);
    }
  };

  // --- [5. 정산 완료 처리 (기존 내역 확정용)] ---
  // PATCH /api/v1/salary/{paymentId}/complete?accountId= — 이미 생성된 정산 내역 완료 처리.
  // execute API는 입금·COMPLETED까지 처리하므로, 이 PATCH는 은행 앱 복귀 등 별도 확정 시에만 사용.
  const completeTransfer = async () => {
    const paymentId = activeTransferItem?.paymentId ?? activeTransferItem?.id;
    const accountId =
      activeTransferItem?.accountId ?? selectedWorker?.accountId;
    if (!paymentId || accountId == null) return;
    try {
      await api.patch(`/api/v1/salary/${paymentId}/complete`, null, {
        params: { accountId: String(accountId) },
      });
      setShowSuccessModal(true);
      loadInitialData();
    } catch (error) {
      console.error("❌ 정산 완료 처리 실패:", error);
      Alert.alert("알림", "정산 완료 상태를 서버에 저장하지 못했습니다.");
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (isTransferring && nextAppState === "active") {
        setIsTransferring(false);
        completeTransfer();
      }
    });
    return () => subscription.remove();
  }, [isTransferring, activeTransferItem]);

  // --- [6. 임금명세서 관련 기능] ---
  // 전체 급여대장 엑셀 (기존 엔드포인트 유지)
  const downloadExcel = async () => {
    try {
      const storedStoreId = await AsyncStorage.getItem("storeId");
      const url = `${api.defaults.baseURL}/api/v1/salary/excel/download?storeId=${storedStoreId}&year=${currentYear}&month=${currentMonth}`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("오류", "다운로드 링크 연결 실패");
    }
  };

  // 알바생 개별 엑셀 다운로드
  const downloadUserExcel = async (worker: MonthlyWorker) => {
    try {
      const storedStoreId = await AsyncStorage.getItem("storeId");
      if (!storedStoreId || !worker?.userId) {
        Alert.alert("오류", "가게 또는 알바생 정보를 찾을 수 없습니다.");
        return;
      }
      const url = `${api.defaults.baseURL}/api/v1/salary/excel/download/user?storeId=${storedStoreId}&userId=${worker.userId}&year=${currentYear}&month=${currentMonth}`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("오류", "개인 엑셀 다운로드 링크 연결 실패");
    }
  };

  const previewPayslip = async (worker: MonthlyWorker) => {
    if (!worker.paymentId) {
      Alert.alert(
        "미리보기 불가",
        "정산 정보가 없어 명세서를 미리볼 수 없습니다.",
      );
      return;
    }

    try {
      console.log("🧾 명세서 미리보기 요청 시작", {
        userId: worker.userId,
        paymentId: worker.paymentId,
        year: currentYear,
        month: currentMonth,
      });

      const response = await api.get<unknown>(
        `/api/v1/salary/${worker.paymentId}/preview`,
        {
          timeout: 15000,
        },
      );

      // 응답이 순수 HTML 문자열인지, data 래핑인지 모두 대응
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (response as any).data;
      const html =
        typeof raw === "string" ? raw : (raw?.data as string | undefined) || "";

      console.log("🧾 명세서 미리보기 응답 수신", {
        hasHtml: !!html,
        previewLength: html.length,
      });

      if (!html) {
        Alert.alert("오류", "미리보기 데이터를 불러오지 못했습니다.");
        return;
      }

      setPreviewHtml(html);
      setShowPreviewModal(true);
    } catch (error: any) {
      console.error(
        "🧾 명세서 미리보기 에러:",
        error?.response?.data || error?.message,
      );
      const serverMsg = error?.response?.data?.message;
      Alert.alert("오류", serverMsg || "미리보기 데이터를 가져올 수 없습니다.");
    }
  };

  const sendPayslipEmail = async (worker: MonthlyWorker) => {
    if (!worker.paymentId) {
      Alert.alert("발송 불가", "정산 정보가 없어 명세서를 발송할 수 없습니다.");
      return;
    }

    try {
      console.log("📧 명세서 발송 요청 시작", {
        name: worker.name,
        userId: worker.userId,
        email: worker.email,
        paymentId: worker.paymentId,
      });

      const res = await api.post(
        `/api/v1/salary/${worker.paymentId}/payslip/send`,
        null,
        {
          timeout: 15000, // 이메일 서버 응답 대기 시간 연장
        },
      );

      console.log("📧 발송 결과:", res.status, res.data);
      Alert.alert("성공", `${worker.name}님께 명세서를 발송했습니다.`);
    } catch (error: any) {
      console.error(
        "📧 발송 에러 상세:",
        error.response?.data || error.message,
      );
      const serverMsg = error.response?.data?.message;
      Alert.alert(
        "발송 실패",
        serverMsg ||
          "이메일 발송 중 오류가 발생했습니다. 알바생 정보에 이메일이 등록되어 있는지 확인해 주세요.",
      );
    }
  };

  const canSendPayslip = !!selectedWorker?.paymentId;

  if (loading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#A28BFF" />
      </View>
    );

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
          {workerList.map((worker, i) => (
            <TouchableOpacity
              key={worker.userId || i}
              style={[
                styles.staffTab,
                selectedWorker?.userId === worker.userId &&
                  styles.staffTabActive,
              ]}
              onPress={() => setSelectedWorker(worker)}
            >
              <Text style={styles.staffTabText}>{worker.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ padding: 20 }}>
          {detailLoading ? (
            <ActivityIndicator color="#A28BFF" style={{ marginTop: 50 }} />
          ) : (
            <>
              <Text style={styles.mainTitle}>급여 이체</Text>
              <View style={styles.salaryCard}>
                <Text
                  style={
                    styles.yearDivider || { color: "#999", marginBottom: 10 }
                  }
                >
                  {currentYear}년
                </Text>
                {salaryHistory.map((item, i) => {
                  const status =
                    item.status ??
                    (item as any).paymentStatus ??
                    (item as any).salaryStatus;
                  const statusUpper = String(status ?? "").toUpperCase();
                  const isCompleted = statusUpper === "COMPLETED";
                  const hasPayment = item.paymentId != null;
                  const isWaitingOrRequested =
                    statusUpper === "WAITING" || statusUpper === "REQUESTED";
                  const canExecute = !hasPayment;
                  const canComplete =
                    hasPayment && isWaitingOrRequested && !isCompleted;
                  const isEstimated = !hasPayment;
                  const amountLabel = isEstimated
                    ? estimatedLoading
                      ? "예상 급여 조회 중…"
                      : "예상 급여"
                    : null;
                  const amountValue = hasPayment
                    ? (item.totalAmount ?? item.amount ?? 0)
                    : (estimatedSalary?.amount ?? null);
                  const amountDisplay = isEstimated
                    ? amountLabel === "예상 급여 조회 중…"
                      ? amountLabel
                      : `${amountValue != null ? Number(amountValue).toLocaleString() : "—"}원`
                    : `${Number(amountValue ?? 0).toLocaleString()}원`;
                  const handleRowAction = () => {
                    if (canExecute) handleExecuteSalary(item);
                    else if (canComplete)
                      handleTransferClick({ ...item, month: currentMonth });
                  };
                  return (
                    <View key={i} style={styles.salaryRow}>
                      <View style={styles.rowItemLeft}>
                        <Text style={styles.monthText}>
                          {item.month}월 월급
                        </Text>
                      </View>
                      <View style={styles.rowItemCenter}>
                        <Text style={styles.amountText}>{amountDisplay}</Text>
                      </View>
                      <View style={styles.rowItemRight}>
                        <TouchableOpacity
                          style={
                            isCompleted
                              ? styles.doneBtn || { backgroundColor: "#EEE" }
                              : styles.calcBtn
                          }
                          onPress={() =>
                            (canExecute || canComplete) && handleRowAction()
                          }
                        >
                          <Text style={styles.calcBtnText}>
                            {isCompleted
                              ? "정산 완료"
                              : canComplete
                                ? "월급 정산"
                                : "월급 정산"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Text style={styles.mainTitle}>임금명세서</Text>
              {/* 1줄차: 엑셀 관련 버튼들 */}
              <View style={styles.toolRow}>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={downloadExcel}
                >
                  <Text style={styles.toolBtnText}>세무사 엑셀</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() =>
                    selectedWorker && downloadUserExcel(selectedWorker)
                  }
                >
                  <Text style={styles.toolBtnText}>개인 엑셀</Text>
                </TouchableOpacity>
              </View>

              {/* 2줄차: 미리보기 / 명세서 발송 */}
              <View style={[styles.toolRow, { marginTop: 10 }]}>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() =>
                    selectedWorker && previewPayslip(selectedWorker)
                  }
                >
                  <Text style={styles.toolBtnText}>미리보기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() =>
                    selectedWorker && sendPayslipEmail(selectedWorker)
                  }
                >
                  <Text style={styles.toolBtnText}>명세서 발송</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* 모달: 계좌 복사 완료 */}
      <Modal visible={showCopyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.copyModalContent}>
            <Text style={styles.modalTitleLarge}>계좌번호 복사 완료</Text>
            <Text style={styles.modalSubTitle}>
              {activeTransferItem?.holder}님: {activeTransferItem?.bank}{" "}
              {activeTransferItem?.account}
            </Text>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={() => {
                setShowCopyModal(false);
                setIsTransferring(true);
                Linking.openURL("kakaobank://");
              }}
            >
              <Text style={styles.modalConfirmText}>은행 앱으로 이동</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCopyModal(false)}
              style={{ marginTop: 15 }}
            >
              <Text style={{ color: "#999" }}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 모달: 정산 완료 알림 */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.copyModalContent}>
            <Text style={styles.modalTitleLarge}>정산 완료</Text>
            <Text style={styles.modalSubTitle}>
              {activeTransferItem?.name ?? selectedWorker?.name}님 정산 처리가
              끝났습니다.
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

      {/* 모달: 명세서 미리보기 */}
      <Modal visible={showPreviewModal} animationType="slide">
        <View style={{ flex: 1, paddingTop: 50, backgroundColor: "#fff" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 15,
              borderBottomWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              임금명세서 미리보기
            </Text>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
              <Text
                style={{ fontSize: 18, color: "#A28BFF", fontWeight: "bold" }}
              >
                닫기
              </Text>
            </TouchableOpacity>
          </View>
          <WebView source={{ html: previewHtml }} style={{ flex: 1 }} />
        </View>
      </Modal>

      <Footer />
    </View>
  );
};

export default Pay;
