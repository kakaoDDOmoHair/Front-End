import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  // 전체 컨테이너 및 스크롤 설정
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  scrollContainer: {
    paddingBottom: 100,
  },

  // --- [1] 타이틀 및 상단 헤더 영역 ---
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    zIndex: 999,
    backgroundColor: "#FFF",
  },
  mainTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#333",
  },
  iconRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  // --- [2] 근무 기록 리스트 섹션 (기록 카드) ---
  historyCard: {
    marginHorizontal: 20,
    backgroundColor: "#F2F2F2",
    borderRadius: 25,
    padding: 18,
    elevation: 2,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 12,
  },
  columnLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#AAA",
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 15,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  dateCell: { flex: 1, textAlign: "center", fontSize: 15, color: "#333" },
  timeCell: { flex: 1, textAlign: "center", fontSize: 15, color: "#333" },

  // --- [3] 하단 고정 캘린더 영역 ---
  calendarWrapper: {
    marginHorizontal: 20,
    backgroundColor: "#F2F2F2",
    borderRadius: 25,
    padding: 15,
    marginBottom: 30,
    elevation: 2,
  },
  monthBox: {
    backgroundColor: "#E0D5FF",
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  monthText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  dayBox: {
    width: (width - 80) / 7,
    height: 65,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  selectedDay: {
    backgroundColor: "#F0EBFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D1C4E9",
  },
  dayText: { fontSize: 15, color: "#444" },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 5,
  },
  badgeText: { fontSize: 9, fontWeight: "bold" },
  badgetext: { fontSize: 15, fontWeight: "bold" },
  // --- [4] 근무 등록 모달 (팝업창) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "88%",
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },

  userTag: {
    backgroundColor: "#F0EBFF",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 18,
  },
  userTagText: {
    fontSize: 12,
    color: "#E0D5FF",
    fontWeight: "bold",
  },

  inputField: {
    marginBottom: 22,
  },
  inputItem: {
    width: "45%",
  },
  inputLabel: {
    fontSize: 20,
    color: "#333",
    fontWeight: "600",
    marginBottom: 10,
  },

  dateInputBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#EEE",
    zIndex: 10,
  },

  inputGroup: {
    marginBottom: 22,
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#AFAFAF",
  },
  timeInput: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    borderRadius: 15,
    paddingVertical: 14,
    textAlign: "center",
    fontSize: 16,
    color: "#AFAFAF",
    borderWidth: 1,
    borderColor: "#EEE",
  },

  // ✨ 휴게시간 버튼 그룹 스타일 추가
  breakTimeGroup: {
    flexDirection: "row",
    gap: 10,
  },
  breakTimeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
  },
  breakTimeBtnActive: {
    backgroundColor: "#F0EBFF",
    borderColor: "#E0D5FF",
  },
  breakTimeText: {
    color: "#AAA",
    fontWeight: "600",
  },
  breakTimeTextActive: {
    color: "#E0D5FF",
  },

  // 모달 버튼 그룹
  modalBtnGroup: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 15,
  },
  cancelBtnText: {
    color: "#999",
    fontWeight: "bold",
  },
  submitBtn: {
    backgroundColor: "#E0D5FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 15,
  },
  submitBtnText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  // 플로팅 메뉴 (수정/삭제 버튼)
  floatingMenu: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 8,
    elevation: 10,
    flexDirection: "row",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F7F7F7",
  },
  menuText: { fontSize: 14, fontWeight: "bold", color: "#333" },

  // 카테고리 선택 버튼 (등록된/기록된)
  categoryGroup: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  categoryBtnActive: {
    borderColor: "#E0D5FF",
    backgroundColor: "#E0D5FF",
  },
  categoryText: { color: "#AAA", fontSize: 15, fontWeight: "600" },
  categoryTextActive: { color: "#333" },

  // 사유 입력창
  reasonInput: {
    backgroundColor: "#F7F7F7",
    borderRadius: 15,
    padding: 15,
    fontSize: 14,
    color: "#AFAFAF",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  // --- [6] 날짜 클릭 상세 정보 모달 전용 스타일 ---
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  detailInfoBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginBottom: 20,
    width: "100%",
  },
  storeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  detailTimeText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  detailSubText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  noWorkText: {
    fontSize: 15,
    color: "#AAA",
    textAlign: "center",
    paddingVertical: 20,
  },

  // 상세 페이지 내 뱃지 크기 보정 (옵션)
  detailBadge: {
    backgroundColor: "#F0EBFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
});
