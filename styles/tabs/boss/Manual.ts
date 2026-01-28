// styles/tabs/boss/Manual.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, backgroundColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute', top: -5, right: -5, backgroundColor: '#FF383C',
    borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  title: { fontSize: 25, fontWeight: 'bold', marginBottom: 15 },
  
  // 사장님 전용: 등록 버튼
  registerBtn: {
    backgroundColor: '#E0D5FF99', borderRadius: 15, paddingVertical: 15,
    alignItems: 'center', marginBottom: 25,
  },
  registerBtnText: { color: '#9747FF', fontWeight: '600', fontSize: 20 },

  // 리스트 카드 스타일
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#DFDFDF4D',
    borderRadius: 10, padding: 20, marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 5, marginRight: 12,
  },
  categoryText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  cardTitle: { flex: 1, fontSize: 18, fontWeight: '600' },
  
  // 버튼 그룹
  btnGroup: { flexDirection: 'row', gap: 5 },
  detailBadge: { backgroundColor: '#E0D5FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15 },
  detailText: { color: '#9747FF', fontSize: 12, fontWeight: '700' },
  deleteBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#E0D5FF4D' },
  deleteText: { color: '#FF383C', fontSize: 12, fontWeight: '700' },

  // 상세 뷰
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 20 },
  detailMainTitle: { flex: 1, textAlign: 'center', fontSize: 25, fontWeight: '600', marginRight: 45 },
  summaryText: { fontSize: 25, fontWeight: 'bold', marginBottom: 25 },
  highlight: { color: '#9747FF' },
  stepContainer: { marginBottom: 25 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  stepDesc: { fontSize: 15, color: '#000000', lineHeight: 22, marginLeft: 10, marginBottom: 10 },

  // 기존 스타일에 아래 항목들을 추가하거나 교체하세요.
inputLabel: { fontSize: 25, fontWeight: 'bold', marginBottom: 15, marginTop: 20 },
dashedInput: {
  borderWidth: 1,
  borderStyle: 'dashed', // 시안의 점선 스타일 적용
  borderColor: '#AFAFAF',
  borderRadius: 10,
  padding: 15,
  fontSize: 15,
},
categoryContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
categoryChip: {
  paddingHorizontal: 15, paddingVertical: 10,
  borderRadius: 10, backgroundColor: '#F2F2F2',
},
categoryChipSelected: { backgroundColor: '#000' },
categoryChipText: { color: '#000000', fontSize: 14, fontWeight: '700' },
categoryChipTextSelected: { color: '#FFF', fontWeight: 'bold' },

stepInputBox: {
  borderWidth: 1, borderStyle: 'dashed', borderColor: '#AFAFAF',
  borderRadius: 10, padding: 20, marginBottom: 20,
},
stepLabel: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },

bottomBtnRow: {
  flexDirection: 'row', justifyContent: 'space-between',
  paddingVertical: 20, gap: 10,
},
nextStepBtn: {  flex: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: '#AFAFAF',
  padding: 15, borderRadius: 15, alignItems: 'center' },
nextStepBtnText: { color: '#000000', fontWeight: '700', fontSize: 16 },
submitBtn: {
  flex: 1, backgroundColor: '#E8E5FF99', 
  padding: 15, borderRadius: 15, alignItems: 'center'
},
submitBtnText: { color: '#9747FF', fontWeight: '700', fontSize: 16 },
});     