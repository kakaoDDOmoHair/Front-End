import { Platform, StatusBar, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // 1. 컨테이너 및 전체 레이아웃
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  
  // 2. 헤더 스타일
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
    height: 70,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // 3. 메인 섹션 및 업로드 버튼
  section: { 
    paddingHorizontal: 20, 
    marginTop: 25 
  },
  sectionTitle: { 
    fontSize: 25, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: '#000' 
  },
  uploadButton: {
    backgroundColor: '#E9E7FDFF',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#9747FF' 
  },

  // 4. 계약 관리 카드 (BossContract용)
  card: {
    backgroundColor: '#DFDFDF4D',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#000', 
    marginBottom: 6 
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 5, 
    marginRight: 6,
  },
  statusText: { 
    fontSize: 15, 
    color: '#5c5c5c' 
  },
  buttonRow: { 
    flexDirection: 'row', 
    gap: 10,
    marginTop: 5, 
  },
  actionButton: {
    backgroundColor: '#E9E7FDFF',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: { 
    fontSize: 15, 
    color: '#000', 
    fontWeight: '400' 
  },

  // 5. 공통 모달 오버레이
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    // 기본값은 중앙 정렬 (스캔 모달용)
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 6. [기존] 계약서 스캔/등록 모달 스타일 (중앙 팝업 형태)
  scannerContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 25,
    alignItems: 'center',
  },
  scannerTitle: { 
    fontSize: 25, 
    fontWeight: 'bold', 
    marginBottom: 25,
    color: '#000'
  },
  guideContainer: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#AFAFAF',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  dashedBox: {
    width: '100%',
    height: 300,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'dashed',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanControlRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    width: '100%' 
  },
  scanControlBtn: { 
    alignItems: 'center' 
  },
  controlIcon: { 
    fontSize: 15, 
    fontWeight: '500',
    color: '#000000'
  },
  
  // 7. ✅ [신규] 계약서 원본 열람 모달 스타일 (하단 슬라이드 형태)
  // 열람 모달 사용 시 모달 오버레이 스타일을 [styles.modalOverlay, { justifyContent: 'flex-end' }] 로 사용하세요.
  documentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    height: '85%', // 화면의 85% 높이 차지
    width: '100%',
  },
  modalTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#000',
  },
  documentPreview: {
    flex: 1,
    marginBottom: 20,
  },
  // 원본 보기 내부의 이미지 박스
  viewDashedBox: {
    flex: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    overflow: 'hidden',
  },

  // 모달 하단 버튼 공통 레이아웃
  modalFooter: { 
    flexDirection: 'row', 
    gap: 12,
    marginTop: 10,
  },

  // 닫기 버튼 (흰색 배경)
  closeBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    borderColor: '#E9E7FD',
    borderWidth: 1,
  },
  closeBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },

  // 등록/다운로드 버튼 (연보라 배경)
  downloadBtn: {
    flex: 2,
    backgroundColor: '#E9E7FD',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#9747FF',
    fontWeight: '600',
    fontSize: 18,
  },

  // 스캔 모달용 버튼들 (기존 유지)
  modalCancelBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9E7FD',
  },
  modalCancelText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#000000' 
  },
  modalSubmitBtn: {
    backgroundColor: '#E9E7FD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  modalSubmitText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#9747FF' 
  },

  // 8. 기타
  emptyText : {
    color: '#AFAFAF',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 30,
    fontSize: 18,
    fontWeight: '400',
  },
  guideText: {
    color: '#AFAFAF',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 30,
    fontSize: 18,
    fontWeight: '400',
  },
});