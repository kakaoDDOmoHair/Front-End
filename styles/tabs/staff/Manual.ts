// styles/tabs/staff/Manual.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // 전체 화면 컨테이너
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // ScrollView 내부 여백을 담당하는 영역 (에러 해결)
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30, 
  },
  // 상단 헤더 (최신 디자인 반영)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  // 알림 배지 스타일
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF383C',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // 리스트 타이틀 및 카드 스타일
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DFDFDF4D',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 12,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  detailBadge: {
    backgroundColor: '#E0D5FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  detailText: {
    color: '#9747FF',
    fontSize: 12,
    fontWeight: '700',
  },
  // 상세 보기 화면 스타일
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  detailMainTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '600',
    marginRight: 30, 
  },
  summaryText: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  highlight: {
    color: '#9747FF',
  },
  stepContainer: {
    marginBottom: 25,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
    marginLeft: 10,
    marginBottom: 10,
  },
});