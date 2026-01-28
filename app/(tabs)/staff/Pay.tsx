import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Footer from "../../../components/common/Footer";
import Header from "../../../components/common/Header";
import { styles } from "../../../styles/tabs/staff/Pay";

const INITIAL_HISTORY = [
  {
    id: 101,
    year: "2025",
    month: "11",
    amount: "480,000",
    status: "COMPLETED",
  },
  {
    id: 102,
    year: "2025",
    month: "12",
    amount: "510,000",
    status: "COMPLETED",
  },
  { id: 103, year: "2026", month: "1", amount: "531,200", status: "WAITING" },
];

const WorkerPay: React.FC = () => {
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [isRequestedToday, setIsRequestedToday] = useState(false);
  const [requestTime, setRequestTime] = useState<string>(""); // ✨ 이 값이 한 번 정해지면 오늘 끝날 때까지 유지됨
  const [lastRequestDate, setLastRequestDate] = useState<string>("");

  // 1. 날짜가 바뀌었을 때만 초기화 (앱을 다시 열 때 실행)
  useEffect(() => {
    const todayStr = new Date().toDateString();
    if (lastRequestDate !== "" && lastRequestDate !== todayStr) {
      setIsRequestedToday(false);
      setRequestTime("");
      setLastRequestDate("");
    }
  }, []);

  const handleRequestSalary = (paymentId: number) => {
    const now = new Date();
    const todayStr = now.toDateString();

    // 2. ✨ [핵심] 만약 이미 오늘 요청한 시간(requestTime)이 저장되어 있다면?
    // 시간 계산 로직을 아예 건너뛰고 바로 상세 페이지로만 이동시킵니다.
    if (requestTime !== "") {
      setIsRequestedToday(true); // 페이지 전환만 발생
      return; // ❌ 아래의 setRequestTime은 실행되지 않음 (시간 고정)
    }

    // 3. ✨ 오직 그날의 '최초 클릭'일 때만 아래 로직이 딱 한 번 실행됩니다.
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${hours}:${minutes}`;

    Alert.alert("알림", "사장님께 급여 정산 요청을 보냈습니다.");

    setRequestTime(formattedTime); // 09:52 저장 (오늘의 찐 마지막 저장)
    setLastRequestDate(todayStr);
    setIsRequestedToday(true);
  };

  return (
    <View style={styles.container}>
      {/* 요청 여부에 따른 헤더 가변 렌더링 */}
      {!isRequestedToday ? (
        <Header notificationCount={1} />
      ) : (
        <View style={styles.topNavigation}>
          <TouchableOpacity onPress={() => setIsRequestedToday(false)}>
            <Text style={styles.backArrow}>〈</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>급여 요청</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {!isRequestedToday ? (
          /* 상황 1: 급여 목록 (사장님 디자인 복제) */
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={styles.mainTitle}>급여 이체</Text>
            <View style={styles.salaryCard}>
              {history.map((item, idx) => {
                const isNewYear =
                  idx === 0 || history[idx - 1].year !== item.year;
                return (
                  <View key={item.id}>
                    {isNewYear && (
                      <View style={styles.yearHeaderRow}>
                        <Text style={styles.yearLabelText}>{item.year}년</Text>
                        <View style={styles.yearLine} />
                      </View>
                    )}
                    <View style={styles.salaryRow}>
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
                      <View style={styles.rowItemRight}>
                        {item.status === "COMPLETED" ? (
                          <View style={styles.doneBadge}>
                            <Text style={styles.doneBadgeText}>정산 완료</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.requestBtn}
                            onPress={() => handleRequestSalary(item.id)}
                          >
                            <Text style={styles.requestBtnText}>급여 요청</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <View style={styles.thinDivider} />
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          /* 상황 2: 최초 요청 시간이 고정된 상세 페이지 */
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
                  <Text style={styles.summaryValue}>52시간 30분</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>요청 금액</Text>
                  <Text style={styles.summaryValue}>541,200원</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>요청 일시</Text>
                  {/* 최초 요청 시간 고정 출력 */}
                  <Text style={styles.summaryValue}>{requestTime}</Text>
                </View>
              </View>

              <View style={styles.verticalTimeline}>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, styles.dotActive]} />
                    <View style={[styles.timelineLine, styles.lineActive]} />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineTitleActive}>요청 완료</Text>
                    <Text style={styles.timelineDate}>{requestTime}</Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineTitle}>사장님 확인 중</Text>
                    <Text style={styles.timelineDesc}>
                      사장님이 요청 알림을 확인하고 있습니다.
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineDot} />
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={styles.timelineTitle}>정산 완료</Text>
                    <Text style={styles.timelineDesc}>
                      입금이 완료되면 목록에서 확인 가능합니다.
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.homeBtn}
                onPress={() => setIsRequestedToday(false)}
              >
                <Text style={styles.homeBtnText}>홈으로 돌아가기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Footer />
    </View>
  );
};

export default WorkerPay;
