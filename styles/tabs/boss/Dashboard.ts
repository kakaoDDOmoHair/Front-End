import { Platform, StatusBar, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // 컨테이너
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    // padding: 20, // (주의) 개별 섹션에서 paddingHorizontal을 주고 있으므로 여기선 제거하거나 조절 필요
    paddingBottom: 100, // 하단 탭바 영역 확보
  },

  // =========================
  // 👋 인사말 영역 (공통)
  // =========================
  greetingContainer: {
    paddingHorizontal: 20,
    marginBottom: 20, // 여백 조정
    marginTop: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  greetingName: {
    color: "#9747FF",
  },

  // =========================
  // 🚫 매장 없음 (Empty State)
  // =========================
  emptyContainer: {
    flex: 1,
    paddingBottom: 10, // Footer 높이만큼 여백
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContent: {
    alignItems: "center",
    width: "100%",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    color: "#000",
    marginBottom: 5,
  },
  emptyDesc: {
    fontSize: 15,
    color: "#AFAFAF",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0D5FF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 3,
    width: 240,
  },
  registerButtonText: {
    color: "#9747FF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  // =========================
  // 🏠 대시보드 메인 (Store Exists)
  // =========================

  // 초대 코드 및 버튼
  inviteRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 30,
    paddingHorizontal: 20, // 스크롤뷰 패딩 대신 여기서 줌
    gap: 8,
  },
  inviteCodeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0D5FF",
    borderStyle: "dashed",
  },
  inviteText: {
    fontSize: 15,
    color: "#000",
  },
  purpleText: {
    color: "#9747FF",
    fontWeight: "bold",
  },
  manualButton: {
    backgroundColor: "#E0D5FF99",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  manualButtonText: {
    fontSize: 15,
    color: "#9747FF",
    fontWeight: "600",
  },

  // 섹션 공통
  section: {
    marginBottom: 40,
    paddingHorizontal: 20, // 좌우 여백
  },
  sectionTitle: {
    fontSize: 22, // 폰트 사이즈 살짝 조정
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  dateText: {
    fontSize: 14,
    color: "#AFAFAF",
    marginBottom: 20,
  },

  // 인건비 영역
  costContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  costAmount: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  costDesc: {
    fontSize: 15,
    color: "#000",
  },

  // 근무자 수 뱃지
  countBadge: {
    backgroundColor: "#E0D5FF99",
    marginLeft: 8,
    marginTop: -13, // 시각적 보정
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  countText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#9747FF",
  },

  // 가로 스크롤 (근무자, 시간표)
  horizontalScroll: {
    paddingVertical: 5,
    // paddingRight는 ScrollView에서 설정하는 것이 좋음
  },

  // 월별 급여 목록
  salaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  salaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  salaryName: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  salaryAmount: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  salaryStatusBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  salaryStatusPending: {
    backgroundColor: "#FFE5E5",
  },
  salaryStatusText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "600",
  },
  emptySalaryContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptySalaryText: {
    fontSize: 14,
    color: "#AFAFAF",
  },

  // To Do List
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20, // 터치 영역 확보를 위해 조금 키움
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#000",
    marginRight: 12,
  },
  todoText: {
    fontSize: 16,
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0", // 입력창 배경색 연하게 변경
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 4, // 높이 조절
    marginTop: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    paddingVertical: 12,
  },
});
