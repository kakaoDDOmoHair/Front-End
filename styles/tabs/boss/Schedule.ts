import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "600",
    marginBottom: 15,
    marginTop: 20,
    fontFamily: "Ownglyph_smartiam",
  },
  sectionCard: {
    backgroundColor: "#F2F2F2",
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
  },

  // 리스트 스타일
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  userName: { width: 60, fontSize: 16, fontWeight: "700", color: "#333" },
  timeText: { flex: 1, textAlign: "center", fontSize: 15, color: "#444" },
  nameBadge: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    width: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  nameBadgeText: { fontSize: 14, fontWeight: "bold", color: "#333" },
  statusDot: { width: 16, height: 16, borderRadius: 8 },

  // 타이틀 및 요일 바
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  daysHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    marginBottom: 15,
  },
  dayText: { fontSize: 13, color: "#999" },
  dayTextActive: { fontSize: 13, color: "#A28BFF", fontWeight: "bold" },

  // 모달 스타일 (통합)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 35,
    padding: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#000" },
  userTag: {
    backgroundColor: "#F0EBFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  userTagText: { color: "#A28BFF", fontWeight: "bold", fontSize: 12 },

  categoryGroup: {
    flexDirection: "row",
    borderRadius: 15,
    padding: 5,
    marginBottom: 25,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderColor: "#AAA",
  },
  categoryBtnActive: { backgroundColor: "#E0D5FF" },
  categoryText: { color: "#000" },
  categoryTextActive: { color: "#000" },

  inputField: { marginBottom: 20 },
  inputLabel: {
    fontSize: 13,
    color: "#AAA",
    marginBottom: 8,
    fontWeight: "600",
  },
  dateInputBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeInputItem: { flex: 1 },
  timeInput: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 12,
    textAlign: "center",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  timeInputFull: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#EEE",
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
  // 캘린더 관련
  fixedContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  headerText: { fontSize: 14, fontWeight: "bold", color: "#666" },
  centerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  centerModalContainer: {
    backgroundColor: "white",
    width: "90%",
    borderRadius: 20,
    overflow: "hidden",
  },
  //휴게
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
});
