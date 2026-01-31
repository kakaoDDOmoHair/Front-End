import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  inviteRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 20,
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
  inviteText: { fontSize: 15, color: "#000" },
  purpleText: { color: "#9747FF", fontWeight: "bold" },
  manualButton: {
    backgroundColor: "#E0D5FF99",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  manualButtonText: { fontSize: 15, color: "#9747FF", fontWeight: "600" },
  section: { marginBottom: 25, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 15,
  },
  dateText: { fontSize: 15, color: "#AFAFAF", marginBottom: 20 },
  salaryContainer: { alignItems: "center", paddingVertical: 10 },
  salaryAmount: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  salaryDesc: { fontSize: 15, color: "#000" },
  blueText: { color: "#0088FF", fontWeight: "bold" },
  salaryPeriod: { color: "#AFAFAF", marginBottom: 15 },
  salaryAmountLarge: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  salaryMetaText: {
    fontSize: 14,
    color: "#000",
    textAlign: "center",
    marginTop: 8,
  },
  salaryNoteText: {
    fontSize: 12,
    color: "#AFAFAF",
    textAlign: "center",
    marginTop: 6,
  },
  salaryDiff: { marginTop: 6, textAlign: "center" },
  salaryDiffRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  salaryDiffLabel: { fontSize: 14, color: "#000" , paddingTop: 10},
  salaryDiffUp: { color: "#FF383C" },
  salaryDiffDown: { color: "#0088FF" },
  salaryDiffText: { fontSize: 14, fontWeight: "600" },
  statusText: { fontSize: 15, color: "#AFAFAF", marginBottom: 15 },
  checkInButton: {
    backgroundColor: "#08051299",
    width: "100%",
    height: 60,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  checkInButtonText: { fontSize: 25, fontWeight: "bold", color: "#000" },
  locationRow: { flexDirection: "row", justifyContent: "center", gap: 15 },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#000",
    marginRight: 12,
  },
  todoText: { fontSize: 16, color: "#000" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 4, // 높이 조절
    marginTop: 10,
  },
  input: { flex: 1, fontSize: 15, color: "#000", marginRight: 12 },
  horizontalScroll: { paddingRight: 20 },
  bottomTab: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 80,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingBottom: 15,
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
    paddingBottom: 100, // Footer 높이만큼 여백
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
    backgroundColor: "#E0D5FF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 3,
  },
  registerButtonText: {
    color: "#9747FF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
});
