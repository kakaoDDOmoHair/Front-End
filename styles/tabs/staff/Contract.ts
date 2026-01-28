import { Platform, StatusBar, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // 1. 기본 레이아웃 및 공통 요소
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 20, // 안드로이드 상태바 여백 대응
    height: 70,    // 로고 이미지 높이 대응
  },

  // 알림 배지
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
  section: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },

  // 2. 근로계약서 상단 카드 (매장 정보)
  contractWrapper: {
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#DFDFDF4D', // 연한 회색
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 15,
    color: '#5c5c5c',
  },

  // 3. 운영 정보 섹션 (카드 외부 분리형)
  infoSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  infoSectionTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#000',
  },
  infoContainer: {
    backgroundColor: 'transparent',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
    width: '25%',
  },
  infoValueBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    minWidth: '70%',
    borderWidth: 1,
    borderColor: '#E9E7FDFF',
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
  },

  // 4. 메인 액션 버튼 (계약서 원본 보기)
  viewButton: {
    backgroundColor: '#E9E7FDFF',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    
  },
  viewButtonText: {
    color: '#9747FF',
    fontSize: 20,
    fontWeight: '600',
  },

  // 5. 모달 (계약서 원본 팝업)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  documentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    height: '80%',
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
  dashedBox: {
    flex: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // 6. 모달 하단 푸터 및 버튼들
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    borderColor: '#E0D5FF',
    borderWidth: 1,
  },
  closeBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  downloadBtn: {
    flex: 2,
    backgroundColor: '#E0D5FF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#9747FF',
    fontWeight: '600',
    fontSize: 18,
  },

  // 7. 기타 상태
  emptyText: {
    color: '#AFAFAF',
    textAlign: 'center',
    marginTop: 10,
  },
});