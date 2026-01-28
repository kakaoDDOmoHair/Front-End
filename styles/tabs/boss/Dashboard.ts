import { Platform, StatusBar, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // 컨테이너
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // 하단 탭바 영역 확보
  },
  
  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  // 초대 코드 및 버튼
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30,
    gap: 8,
  },
  inviteCodeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0D5FF',
    borderStyle: 'dashed',
  },
  inviteText: {
    fontSize: 15,
    color: '#000',
  },
  purpleText: {
    color: '#9747FF',
    fontWeight: 'bold',
  },
  manualButton: {
    backgroundColor: '#E0D5FF99',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  manualButtonText: {
    fontSize: 15,
    color: '#9747FF',
    fontWeight: 'bold',
  },

  // 섹션 공통
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateText: {
    fontSize: 15,
    color: '#AFAFAF',
    marginBottom: 20,
  },

  // 인건비 영역
  costContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  costAmount: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  costDesc: {
    fontSize: 15,
    color: '#000',
  },
  redText: {
    color: '#FF383C',
    fontWeight: 'bold',
  },

  // 근무자 수 뱃지
  countBadge: {
    backgroundColor: '#E0D5FF99',
    marginLeft: 8,
    marginTop: -4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9747FF',
  },

  // 가로 스크롤
  horizontalScroll: {
    paddingVertical: 5,
    paddingRight: 20,
  },

  // To Do List
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 4,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 12,
    marginLeft: 20,
  },
  todoText: {
    fontSize: 15,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0D5FF4D',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    paddingVertical: 8,
  },

  // 하단 탭바 (Bottom Tab)
  bottomTab: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 10,
  },
});

