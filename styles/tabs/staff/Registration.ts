import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 10,
  },
  logo: {
    width: 90,
    height: 70,
  },
  notificationBtn: {
    position: "relative",
    padding: 5,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  // ✨ 사장님 페이지와 동일한 여백 설정
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  pageTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    fontWeight: "600",
    marginLeft: 5,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
    fontWeight: "bold",
  },
  authRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 10,
  },
  authBtn: {
    backgroundColor: "rgba(224,213,255,0.6)",
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  authBtnText: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    alignItems: "flex-end",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "rgba(224,213,255,0.6)",
    width: 130,
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    alignSelf: "flex-end",
    marginRight: 10,
  },
  submitButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "bold",
  },
});
