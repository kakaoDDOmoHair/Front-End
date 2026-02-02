import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import api from "../../../constants/api";
import { useNotificationCount } from "../../../hooks/useNotificationCount";
import { styles } from "../../../styles/tabs/staff/Pay";

interface SalaryHistoryItem {
  id: number;
  paymentId: number;
  year: string;
  month: string;
  amount: string;
  status: string;
  // 백엔드에서 /salary/history 응답에 추가된 총 근로 시간(시간 단위)
  totalHours?: number | null;
}

interface CurrentMonthSalary {
  paymentId: number | null;
  year: number;
  month: number;
  amount: number;
  status: string;
  baseSalary?: number;
  weeklyAllowance?: number;
  tax?: number;
  totalHours?: number;
}

type SalaryRequestResponse = {
  status: string;
  message?: string;
  data?: {
    paymentId: number;
    year: number;
    month: number;
    amount: number;
    totalHours: number;
    status: string;
    baseSalary: number;
    weeklyAllowance: number;
    tax: number;
  };
};

const normalizeSalaryStatus = (raw?: unknown) => {
  const status = String(raw ?? "").toUpperCase();
  if (!status) return "";
  if (status === "REQUESTED") return "REQUESTED";
  const completedTokens = [
    "COMPLETED",
    "COMPLETE",
    "DONE",
    "PAID",
    "PAYED",
    "TRANSFER",
    "FINISHED",
    "CONFIRMED",
    "SETTLED",
    "SETTLEMENT",
    "SUCCESS",
  ];
  const waitingTokens = ["WAIT", "ACK", "PENDING", "IN_PROGRESS", "PROCESS"];
  const negativeTokens = ["NOT", "UN", "CANCEL", "FAILED", "ERROR"];
  const hasCompletedToken = completedTokens.some((token) =>
    status.includes(token),
  );
  const hasWaitingToken = waitingTokens.some((token) => status.includes(token));
  const hasNegativeToken = negativeTokens.some((token) =>
    status.includes(token),
  );
  if (hasCompletedToken && !hasNegativeToken) return "COMPLETED";
  if (hasWaitingToken) return "WAITING";
  return status;
};

const getStatusRank = (status?: string) => {
  switch (status) {
    case "COMPLETED":
      return 3;
    case "WAITING":
      return 2;
    case "REQUESTED":
      return 1;
    default:
      return 0;
  }
};

const WorkerPay: React.FC = () => {
  const notificationCount = useNotificationCount("staff");
  const [history, setHistory] = useState<SalaryHistoryItem[]>([]);
  const [currentMonth, setCurrentMonth] = useState<CurrentMonthSalary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [isRequestedToday, setIsRequestedToday] = useState(false);
  const [requestSummary, setRequestSummary] = useState<{
    time: string;
    amount: string;
    workHours: string;
  }>({ time: "", amount: "", workHours: "—" });
  const [lastRequestDate, setLastRequestDate] = useState("");
  const [lastRequestUserId, setLastRequestUserId] = useState<string | null>(
    null,
  );
  const [requestLoading, setRequestLoading] = useState(false);

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

  const ensureUserAndStoreId = async () => {
    let userIdStr = await AsyncStorage.getItem("userId");
    let storeIdStr = await AsyncStorage.getItem("storeId");

    if (!userIdStr || !storeIdStr) {
      const username = await AsyncStorage.getItem("username");
      if (!username) return { userId: null, storeId: null };

      const meRes = await api.get("/api/v1/users/me", { params: { username } });
      const me = meRes.data?.data ?? meRes.data;

      const uid = me?.userId ?? me?.id ?? null;
      const sid = me?.storeId ?? me?.store?.storeId ?? me?.store?.id ?? null;

      if (uid != null) await AsyncStorage.setItem("userId", String(uid));
      if (sid != null) await AsyncStorage.setItem("storeId", String(sid));

      userIdStr = uid != null ? String(uid) : null;
      storeIdStr = sid != null ? String(sid) : null;
    }

    const userId = userIdStr ? Number(userIdStr) : null;
    const storeId = storeIdStr ? Number(storeIdStr) : null;
    return {
      userId: Number.isFinite(userId as number) ? (userId as number) : null,
      storeId: Number.isFinite(storeId as number) ? (storeId as number) : null,
    };
  };

  const loadMySalaryData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const userId = await AsyncStorage.getItem("userId");

      console.log("📋 급여 내역 조회", {
        userId,
        hasToken: !!Object.keys(headers).length,
      });

      if (!userId) {
        console.warn("📋 userId 없음 (로그인 후 AsyncStorage 확인)");
        setHistory([]);
        return;
      }

      const res = await api.get("/api/v1/salary/history", {
        params: { userId },
        headers,
      });

      const rawList = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? res.data?.list ?? []);

      console.log("📋 급여 내역 응답", { count: rawList.length, raw: rawList });

      if (rawList.length > 0) {
        const today = new Date();
        const mapped: SalaryHistoryItem[] = rawList.map((p: any) => {
          const monthRaw = p.month ?? "";
          const monthNum =
            String(monthRaw).replace(/월$/, "") || String(today.getMonth() + 1);

          return {
            id: p.id,
            paymentId: p.paymentId ?? p.id,
            year: String(p.year ?? today.getFullYear()),
            month: String(monthNum),
            amount:
              typeof p.amount === "number"
                ? p.amount.toLocaleString()
                : String(p.amount ?? "0"),
            status:
              normalizeSalaryStatus(
                p.status ?? p.paymentStatus ?? p.salaryStatus,
              ) || "WAITING",
            totalHours:
              p.totalHours != null && !Number.isNaN(Number(p.totalHours))
                ? Number(p.totalHours)
                : null,
          };
        });
        console.log("📋 급여 내역 매핑 결과", {
          count: mapped.length,
          statuses: mapped.map((m) => ({ month: m.month, status: m.status })),
        });
        setHistory(mapped);
      } else {
        setHistory([]);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ?? error?.message ?? "알 수 없는 오류";
      console.error("📋 알바생 급여 내역 조회 실패:", status, msg);
      setHistory([]);
      if (status === 500 && String(msg).includes("사용자 없음")) {
        Alert.alert(
          "계정 확인",
          "서버에서 사용자 정보를 찾을 수 없습니다. 다시 로그인하거나, 백엔드에서 해당 사용자(userId)가 등록되어 있는지 확인해 주세요.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMonthSalary = async () => {
    try {
      const headers = await getAuthHeader();
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;

      const res = await api.get("/api/v1/salary/current", {
        params: { userId, year, month },
        headers,
      });
      const data = res.data?.data ?? res.data;

      const rawHours = (data as any)?.totalHours ?? null;
      const totalHours =
        rawHours != null && !Number.isNaN(Number(rawHours))
          ? Number(rawHours)
          : undefined;

      const rawStatus =
        (data as any)?.status ??
        (data as any)?.paymentStatus ??
        (data as any)?.salaryStatus ??
        "";
      console.log("📋 현재 월 급여 raw status", rawStatus, data);
      setCurrentMonth({
        ...(data as CurrentMonthSalary),
        status: normalizeSalaryStatus(rawStatus) || rawStatus || "ESTIMATED",
        totalHours,
      });
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message ?? e?.message ?? "알 수 없는 오류";
      console.warn("📋 현재 월 급여 조회 실패:", status, msg);
      setCurrentMonth(null);
    }
  };

  useEffect(() => {
    loadMySalaryData();
    fetchCurrentMonthSalary();
  }, []);

  useEffect(() => {
    if (!isRequestedToday) return;
    const interval = setInterval(() => {
      loadMySalaryData();
      fetchCurrentMonthSalary();
    }, 5000);
    return () => clearInterval(interval);
  }, [isRequestedToday]);

  useEffect(() => {
    const restore = async () => {
      const todayStr = new Date().toDateString();
      const stored = await AsyncStorage.getItem("salary_request_date");
      const storedUserIdStr = await AsyncStorage.getItem(
        "salary_request_userId",
      );
      const time = await AsyncStorage.getItem("salary_request_time");
      const amount = await AsyncStorage.getItem("salary_request_amount");
      const workHours = await AsyncStorage.getItem("salary_request_work_hours");

      const currentUserIdStr = await AsyncStorage.getItem("userId");
      const currentUserId =
        currentUserIdStr ?? (await ensureUserAndStoreId()).userId;
      const currentUserIdNormalized =
        currentUserId != null ? String(currentUserId) : "";

      const sameDay = stored === todayStr;
      const sameUser =
        storedUserIdStr != null && storedUserIdStr === currentUserIdNormalized;

      console.log("📋 요청 정보 복원", {
        todayStr,
        stored,
        storedUserIdStr,
        currentUserIdNormalized,
        sameDay,
        sameUser,
        hasTime: !!time,
        hasAmount: !!amount,
        hasWorkHours: !!workHours,
      });

      if (!sameDay || !sameUser) {
        setLastRequestDate("");
        setLastRequestUserId(null);
        setRequestSummary({ time: "", amount: "", workHours: "—" });
        setIsRequestedToday(false);
        try {
          await AsyncStorage.multiRemove([
            "salary_request_time",
            "salary_request_date",
            "salary_request_amount",
            "salary_request_work_hours",
            "salary_request_userId",
          ]);
        } catch (_) {}
        return;
      }

      if (stored) setLastRequestDate(stored);
      if (storedUserIdStr) setLastRequestUserId(storedUserIdStr);
      if (time != null || amount != null || workHours != null) {
        setRequestSummary({
          time: time ?? "",
          amount: amount ?? "",
          workHours: workHours ?? "—",
        });
        setIsRequestedToday(true);
      }
    };
    restore();
  }, []);

  useEffect(() => {
    const todayStr = new Date().toDateString();
    if (lastRequestDate !== "" && lastRequestDate !== todayStr) {
      setIsRequestedToday(false);
      setLastRequestDate("");
      setLastRequestUserId(null);
      setRequestSummary({ time: "", amount: "", workHours: "—" });
      AsyncStorage.multiRemove([
        "salary_request_time",
        "salary_request_date",
        "salary_request_amount",
        "salary_request_work_hours",
        "salary_request_userId",
      ]);
    }
  }, [lastRequestDate]);

  const buildSummaryKey = (
    userId: string,
    year: string,
    month: string,
  ) => `salary_request_summary_${userId}_${year}-${month.padStart(2, "0")}`;

  const openStoredSummary = async (year: string, month: string) => {
    const currentUserIdStr = (await AsyncStorage.getItem("userId")) ?? "";
    if (!currentUserIdStr) {
      Alert.alert("알림", "사용자 정보를 찾을 수 없습니다.");
      return;
    }
    const key = buildSummaryKey(currentUserIdStr, year, month);
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          time?: string;
          amount?: string;
          workHours?: string;
        };
        setRequestSummary({
          time: parsed.time ?? "",
          amount: parsed.amount ?? "",
          workHours: parsed.workHours ?? "—",
        });
        setIsRequestedToday(true);
        return;
      } catch (_) {
        // fallback to legacy keys below
      }
    }

    const time = await AsyncStorage.getItem("salary_request_time");
    const amount = await AsyncStorage.getItem("salary_request_amount");
    const workHours = await AsyncStorage.getItem("salary_request_work_hours");
    if (time != null || amount != null || workHours != null) {
      setRequestSummary({
        time: time ?? "",
        amount: amount ?? "",
        workHours: workHours ?? "—",
      });
      setIsRequestedToday(true);
      return;
    }
    Alert.alert("알림", "정산 요청 기록을 찾을 수 없습니다.");
  };

  const handleRequestSalary = async (item: {
    id: number;
    paymentId?: number | null;
    year: string;
    month: string;
    amount: string;
    status: string;
  }) => {
    const now = new Date();
    const todayStr = now.toDateString();

    console.log("📋 정산 요청 버튼 클릭", {
      item,
      hasPaymentId: item.paymentId != null,
      requestSummary,
    });

    try {
      setRequestLoading(true);
      const headers = await getAuthHeader();

      const hasPaymentId =
        item.paymentId != null && item.paymentId !== undefined;

      const ensured = await ensureUserAndStoreId();

      const body: Record<string, number> = hasPaymentId
        ? { paymentId: item.paymentId as number }
        : {
            userId: ensured.userId ?? NaN,
            storeId: ensured.storeId ?? NaN,
            year: Number(item.year) || new Date().getFullYear(),
            month: Number(item.month) || new Date().getMonth() + 1,
          };

      if (!hasPaymentId && (isNaN(body.userId) || isNaN(body.storeId))) {
        Alert.alert(
          "알림",
          "로그인 정보(또는 가게 정보)를 확인할 수 없습니다. 다시 로그인해 주세요.",
        );
        return;
      }

      const res = await api.post("/api/v1/salary/request", body, { headers });
      const response = res.data as SalaryRequestResponse;

      if (
        res.status < 200 ||
        res.status >= 300 ||
        response.status !== "success"
      ) {
        Alert.alert("오류", response.message || "요청 전송에 실패했습니다.");
        return;
      }

      const payload = response.data;
      const backendAmount = payload?.amount;
      const backendHours = payload?.totalHours;

      // 🔍 백엔드에서 내려준 근로시간·요청 금액을 콘솔로 확인
      console.log("📋 정산 요청 응답 payload", {
        amount: backendAmount,
        totalHours: backendHours,
        raw: payload,
      });

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formattedTime = `${now.getFullYear()}.${String(
        now.getMonth() + 1,
      ).padStart(
        2,
        "0",
      )}.${String(now.getDate()).padStart(2, "0")} ${hours}:${minutes}`;

      const amountStr =
        backendAmount != null
          ? `${Number(backendAmount).toLocaleString()}원`
          : item.amount
            ? `${String(item.amount).replace(/원$/, "")}원`
            : "—";

      const rawHours = backendHours ?? currentMonth?.totalHours ?? null;
      const totalHours =
        rawHours != null && !Number.isNaN(Number(rawHours))
          ? Number(rawHours)
          : null;

      const workHoursStr =
        totalHours != null
          ? `${Math.floor(totalHours)}시간 ${Math.round(
              (totalHours - Math.floor(totalHours)) * 60,
            )}분`
          : "—";

      const currentUserIdStr =
        (await AsyncStorage.getItem("userId")) ?? String(ensured.userId ?? "");
      const isFirstRequestToday =
        lastRequestDate !== todayStr || lastRequestUserId !== currentUserIdStr;
      const requestTime = isFirstRequestToday
        ? formattedTime
        : requestSummary.time?.trim() || formattedTime;

      setLastRequestDate(todayStr);
      setLastRequestUserId(currentUserIdStr);

      const summary = {
        time: requestTime,
        amount: amountStr,
        workHours: workHoursStr,
      };

      console.log("📋 요청 완료 요약 설정", summary);
      setRequestSummary(summary);

      try {
        await AsyncStorage.multiSet([
          ["salary_request_time", summary.time],
          ["salary_request_date", todayStr],
          ["salary_request_amount", summary.amount],
          ["salary_request_work_hours", summary.workHours],
          ["salary_request_userId", currentUserIdStr],
        ]);
      } catch (_) {}

      setIsRequestedToday(true);

      setHistory((prev) =>
        prev.map((h) => {
          const match = hasPaymentId
            ? (h as any).id === item.id ||
              (h as any).paymentId === item.paymentId
            : String((h as any).year) === String(item.year) &&
              String((h as any).month) === String(item.month);
          return match ? { ...h, status: "REQUESTED" } : h;
        }),
      );

      const today = new Date();
      if (
        item.year === String(today.getFullYear()) &&
        item.month === String(today.getMonth() + 1)
      ) {
        setCurrentMonth((prev) =>
          prev ? { ...prev, status: "REQUESTED" } : null,
        );
      }
    } catch (error: any) {
      console.error("❌ 정산 요청 실패:", error);
      const msg =
        error?.response?.data?.message ||
        "요청 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      Alert.alert("오류", msg);
    } finally {
      setRequestLoading(false);
    }
  };

  const mergedList = useMemo(() => {
    type Row = {
      id: number;
      paymentId: number | null;
      year: string;
      month: string;
      amount: string;
      status: string;
    };

    const base: Row[] = history.map((h) => ({
      id: h.id,
      paymentId: h.paymentId ?? h.id,
      year: h.year,
      month: h.month,
      amount: h.amount,
      status: h.status,
    }));

    if (currentMonth != null) {
      const idx = base.findIndex(
        (x) =>
          String(x.year) === String(currentMonth.year) &&
          String(x.month) === String(currentMonth.month),
      );
      const row: Row = {
        id: idx >= 0 ? base[idx].id : -1,
        paymentId:
          currentMonth.paymentId ?? (idx >= 0 ? base[idx].paymentId : null),
        year: String(currentMonth.year),
        month: String(currentMonth.month),
        amount:
          typeof currentMonth.amount === "number"
            ? currentMonth.amount.toLocaleString()
            : String(currentMonth.amount ?? "0"),
        status: currentMonth.status,
      };
      return idx >= 0
        ? base.map((b, i) => (i === idx ? row : b))
        : [row, ...base];
    }

    return base;
  }, [history, currentMonth]);

  const requestedStatus = useMemo(() => {
    const today = new Date();
    const year = String(today.getFullYear());
    const month = String(today.getMonth() + 1);
    const match = history.find(
      (h) => String(h.year) === year && String(h.month) === month,
    );
    const historyStatusRaw = match?.status ?? "";
    const currentStatusRaw = currentMonth?.status ?? "";
    const historyNormalized = normalizeSalaryStatus(historyStatusRaw);
    const currentNormalized = normalizeSalaryStatus(currentStatusRaw);
    const historyRank = getStatusRank(historyNormalized);
    const currentRank = getStatusRank(currentNormalized);
    const resolved =
      historyRank >= currentRank ? historyStatusRaw : currentStatusRaw;
    console.log("📋 요청 상태 계산", {
      currentStatusRaw,
      historyStatusRaw,
      resolved,
      normalized: normalizeSalaryStatus(resolved),
      historyRank,
      currentRank,
    });
    return (
      normalizeSalaryStatus(resolved) ||
      String(resolved ?? "").toUpperCase()
    );
  }, [currentMonth, history]);

  const isRequested = requestedStatus === "REQUESTED";
  const isConfirming = requestedStatus === "WAITING";
  const isCompleted = requestedStatus === "COMPLETED";
  const showConfirming = isRequested || isConfirming || isCompleted;

  return (
    <SafeAreaView style={styles.container}>
{!isRequestedToday ? (
        <Header notificationCount={notificationCount} />
      ) : (
        /* 1번 수정 구간: 알림 센터 스타일과 동일하게 적용 */
        <View style={styles.pageHeader}> 
          <TouchableOpacity
            onPress={() => setIsRequestedToday(false)} // 요청 화면 닫기 로직 유지
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.pageHeaderTitle}>급여 요청</Text>
          
          {/* 타이틀을 중앙에 배치하기 위해 우측에 투명한 Spacer를 둡니다 (선택 사항) */}
          <View style={{ width: 28 }} /> 
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isRequestedToday ? (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={styles.mainTitle}>급여 이체</Text>

            {loading ? (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#A28BFF" />
              </View>
            ) : mergedList.length === 0 ? (
              <View style={styles.salaryCard}>
                <Text
                  style={{ textAlign: "center", color: "#888", fontSize: 15 }}
                >
                  급여 내역이 없습니다.
                </Text>
                <Text
                  style={{
                    textAlign: "center",
                    color: "#AAA",
                    fontSize: 13,
                    marginTop: 8,
                  }}
                >
                  로그인 계정(userId)·API(/api/v1/salary/history,
                  /salary/current)를 확인해 주세요.
                </Text>
              </View>
            ) : (
              <View style={styles.salaryCard}>
                {mergedList.map((item, idx) => {
                  const isNewYear =
                    idx === 0 || mergedList[idx - 1].year !== item.year;
                  const statusUpper = String(item.status ?? "").toUpperCase();
                  const canShowButton =
                    statusUpper !== "COMPLETED" && statusUpper !== "REQUESTED";

                  return (
                    <View
                      key={
                        item.id >= 0
                          ? item.id
                          : `current-${item.year}-${item.month}`
                      }
                    >
                      {isNewYear && (
                        <View style={styles.yearHeaderRow}>
                          <Text style={styles.yearLabelText}>
                            {item.year}년
                          </Text>
                          <View style={styles.yearLine} />
                        </View>
                      )}

                      <View style={styles.salaryRow} collapsable={false}>
                        <View style={styles.rowItemLeft}>
                          <Text style={styles.monthText}>
                            {item.month}월 월급
                          </Text>
                        </View>
                        <View style={styles.rowItemCenter}>
                          <Text style={styles.historyAmountText}>
                            {item.amount}원
                          </Text>
                        </View>
                        <View style={styles.rowItemRight} collapsable={false}>
                          {statusUpper === "COMPLETED" ? (
                            <TouchableOpacity
                              style={styles.doneBadge}
                              activeOpacity={0.7}
                              hitSlop={{
                                top: 12,
                                bottom: 12,
                                left: 12,
                                right: 12,
                              }}
                              onPress={() =>
                                openStoredSummary(item.year, item.month)
                              }
                            >
                              <Text style={styles.doneBadgeText}>
                                정산 완료
                              </Text>
                            </TouchableOpacity>
                          ) : statusUpper === "REQUESTED" ? (
                            <TouchableOpacity
                              style={styles.doneBadge}
                              activeOpacity={0.7}
                              hitSlop={{
                                top: 12,
                                bottom: 12,
                                left: 12,
                                right: 12,
                              }}
                              onPress={() =>
                                openStoredSummary(item.year, item.month)
                              }
                            >
                              <Text style={styles.doneBadgeText}>요청됨</Text>
                            </TouchableOpacity>
                          ) : canShowButton ? (
                            <TouchableOpacity
                              style={styles.requestBtn}
                              disabled={requestLoading}
                              onPress={() =>
                                handleRequestSalary({
                                  ...item,
                                  paymentId: item.paymentId,
                                  id: item.id,
                                })
                              }
                            >
                              {requestLoading ? (
                                <ActivityIndicator
                                  size="small"
                                  color="#A28BFF"
                                />
                              ) : (
                                <Text style={styles.requestBtnText}>
                                  급여 요청
                                </Text>
                              )}
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.doneBadge}>
                              <Text style={styles.doneBadgeText}>
                                급여 요청
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.thinDivider} />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.successWrapper}>
            <View style={styles.whiteHeader}>
              <Image
                source={require("../../../assets/images/check.png")}
                style={styles.checkImage}
                resizeMode="contain"
              />
              <Text style={styles.successMainTitle}>
                정산 요청을 완료했습니다!
              </Text>
            </View>

            <View style={styles.contentArea}>
              <View style={styles.summaryCardGray}>
                <Text style={styles.summaryTitle}>요약</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>근로 시간</Text>
                  <Text style={styles.summaryValue}>
                    {requestSummary.workHours?.trim() || "—"}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>요청 금액</Text>
                  <Text style={styles.summaryValue}>
                    {requestSummary.amount?.trim() || "—"}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>요청 일시</Text>
                  <Text style={styles.summaryValue}>
                    {requestSummary.time?.trim() || "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.verticalTimeline}>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, styles.dotActive]} />
                    <View
                      style={[
                        styles.timelineLine,
                        showConfirming && styles.lineActive,
                      ]}
                    />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineTitleActive}>요청 완료</Text>
                    <Text style={styles.timelineDate}>
                      {requestSummary.time?.trim() || "—"}
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        showConfirming && styles.dotActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.timelineLine,
                        isCompleted && styles.lineActive,
                      ]}
                    />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text
                      style={
                        showConfirming
                          ? styles.timelineTitleActive
                          : styles.timelineTitle
                      }
                    >
                      사장님 확인 중
                    </Text>
                    <Text
                      style={
                        showConfirming
                          ? styles.timelineDescActive
                          : styles.timelineDesc
                      }
                    >
                      사장님이 요청 알림을 확인하고 있습니다.
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        isCompleted && styles.dotActive,
                      ]}
                    />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text
                      style={
                        isCompleted
                          ? styles.timelineTitleActive
                          : styles.timelineTitle
                      }
                    >
                      정산 완료
                    </Text>
                    <Text
                      style={
                        isCompleted
                          ? styles.timelineDescActive
                          : styles.timelineDesc
                      }
                    >
                      입금이 완료되면 목록에서 확인 가능합니다.
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => {
                  setIsRequestedToday(false);
                  loadMySalaryData();
                  fetchCurrentMonthSalary();
                }}
              >
                <Text style={styles.homeBtnText}>홈으로 돌아가기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
};

export default WorkerPay;