import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },

  // ✨ 상단 네비게이션 (헤더 대체)
  topNavigation: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#FFF",
  },
  backArrow: {
    fontSize: 24,
    fontWeight: "300",
    color: "#000",
    marginRight: 20,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },

  scrollContainer: { paddingBottom: 120 },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 20,
    color: "#333",
  },

  // 급여 리스트 디자인 (사장님용 복제)
  salaryCard: { backgroundColor: "#F9F9F9", borderRadius: 25, padding: 20 },
  yearHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  yearLabelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#AAA",
    marginRight: 10,
  },
  yearLine: { flex: 1, height: 1, backgroundColor: "#EEE" },
  salaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  rowItemLeft: { flex: 1.2 },
  rowItemCenter: { flex: 1.5, alignItems: "center" },
  rowItemRight: { flex: 1, alignItems: "flex-end" },
  monthText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  historyAmountText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  requestBtn: {
    backgroundColor: "#EBE6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  requestBtnText: { color: "#000", fontSize: 13, fontWeight: "bold" },
  doneBadge: {
    backgroundColor: "#EEE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneBadgeText: { color: "#AAA", fontSize: 13, fontWeight: "bold" },
  thinDivider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 10 },

  // 정산 요청 완료 페이지
  successWrapper: { flex: 1 },
  whiteHeader: { alignItems: "center", paddingTop: 20, paddingBottom: 30 },
  checkImage: { width: 80, height: 80, marginBottom: 20 },
  successMainTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  contentArea: { paddingHorizontal: 25 },
  summaryCardGray: {
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: { color: "#888", fontSize: 14 },
  summaryValue: { fontWeight: "600", fontSize: 14, color: "#333" },

  // 세로형 타임라인
  verticalTimeline: { paddingLeft: 10, marginBottom: 30 },
  timelineItem: { flexDirection: "row", minHeight: 70 },
  timelineLeft: { alignItems: "center", width: 20, marginRight: 15 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#DDD",
  },
  dotActive: {
    backgroundColor: "#A28BFF",
    borderWidth: 2,
    borderColor: "#EBE6FF",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#EEE",
    marginTop: -2,
    marginBottom: -2,
  },
  lineActive: { backgroundColor: "#A28BFF" },
  timelineRight: { flex: 1, paddingBottom: 20 },
  timelineTitle: { fontSize: 15, fontWeight: "bold", color: "#BBB" },
  timelineTitleActive: { fontSize: 15, fontWeight: "bold", color: "#333" },
  timelineDate: { fontSize: 12, color: "#A28BFF", marginTop: 3 },
  timelineDesc: { fontSize: 12, color: "#AAA", marginTop: 3 },

  homeBtn: {
    backgroundColor: "#EBE6FF",
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
  },
  homeBtnText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});
