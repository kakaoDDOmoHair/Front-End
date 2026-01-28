// ../../../styles/tabs/boss/BossInfoStyles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    height: 60,
  },
  headerTitle: { fontSize: 25, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // ✅ 프로필 요약 스타일 추가
  profileSummary: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginVertical: 25 
  },
  avatarCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#E0D5FF99', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profileText: { marginLeft: 20 },
  nameText: { fontSize: 25, fontWeight: 'bold', color: '#000' },
  shopText: { fontSize: 18, color: '#AFAFAF', marginTop: 5 },

  // 섹션 스타일
  sectionContainer: { marginTop: 15 },
  sectionTitle: { fontSize: 25, fontWeight: 'bold', color: '#000', marginBottom: 10 },
  infoCard: { backgroundColor: '#DFDFDF4D', borderRadius: 10, padding: 15 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  lastItem: { marginBottom: 0 },
  label: { fontSize: 18, color: '#000', width: 100, fontWeight: '600' },
  valueContainer: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 12, 
    borderWidth: 1, 
    borderColor: '#E0D5FF99' 
  },
  valueText: { fontSize: 15, color: '#666' },
});