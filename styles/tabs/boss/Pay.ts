import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // 전체 컨테이너 및 스크롤
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // 알바생 선택 탭
  staffTabRow: {
    marginTop: 20,
    marginBottom: 30,
  },
  staffTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    marginRight: 10,
  },
  staffTabActive: {
    backgroundColor: "#000",
  },
  staffTabText: {
    color: "#888",
    fontWeight: "bold",
  },

  // 메인 타이틀
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },

  // 급여 이체 카드 섹션
  salaryCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 25,
    padding: 20,
    marginBottom: 40,
  },

  // ✨ 연도 헤더 및 구분선 (요청하신 부분)
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
  yearLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEE",
  },

  // ✨ 열 위치 맞춤용 아이템 (flex 비율 고정)
  salaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  rowItemLeft: {
    flex: 1.2, // @@월 월급 위치
  },
  rowItemCenter: {
    flex: 1.5, // 금액 위치 (가운데 정렬)
    alignItems: "center",
  },
  rowItemRight: {
    flex: 1, // 버튼 위치 (우측 정렬)
    alignItems: "flex-end",
  },

  // 텍스트 상세 스타일
  monthText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  subText: {
    fontSize: 11,
    color: "#A28BFF",
    marginTop: 2,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  historyMonthText: {
    fontSize: 15,
    color: "#888",
  },
  historyAmountText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888",
  },

  // 버튼 및 배지 스타일
  calcBtn: {
    backgroundColor: "#E9E7FDFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  calcBtnText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "bold",
  },
  doneBadge: {
    backgroundColor: "#EEE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneBadgeText: {
    color: "#AAA",
    fontSize: 13,
    fontWeight: "bold",
  },
  thinDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 10,
  },

  // 임금명세서 도구 버튼
  toolRow: {
    flexDirection: "row",
    gap: 10,
  },
  toolBtn: {
    backgroundColor: "#E9E7FDFF",
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtnText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "400",
  },

  // 모달 공통 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  previewModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: "65%",
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  previewBox: {
    width: "100%",
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  previewPlaceholder: {
    color: "#AAA",
  },
  previewBtnGroup: {
    flexDirection: "row",
    width: "100%",
    gap: 15,
  },
  previewCloseBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    borderColor: "#E9E7FD",
    borderWidth: 1,
  },
  previewCloseBtnText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
  },
  previewDownloadBtn: {
    flex: 2,
    backgroundColor: "#E9E7FD",
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  previewDownloadBtnText: {
    color: "#9747FF",
    fontWeight: "600",
    fontSize: 18,
  },

  // 계좌 복사 모달
  copyModalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
  },
  modalTitleLarge: {
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  modalSubTitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },
  modalConfirmBtn: {
    backgroundColor: "#E9E7FDFF",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
});
