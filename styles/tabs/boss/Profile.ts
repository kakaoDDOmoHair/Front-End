import { StyleSheet } from 'react-native';

// ✅ 기존 일반 스타일
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: '#FF383C', borderRadius: 10,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  sectionContainer: { width: '100%', marginTop: 20 },
  sectionTitle: { fontSize: 25, fontWeight: 'bold', marginBottom: 15, color: '#000' },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 20, backgroundColor: '#DFDFDF4D', borderRadius: 10,
    marginVertical: 3, paddingHorizontal: 20, marginBottom: 20,
  },
  menuText: { fontSize: 18, fontWeight: '600', color: '#000000' }
});

// ✅ 새로 옮겨온 모달 전용 스타일
export const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', maxHeight: '85%', backgroundColor: '#fff', borderRadius: 15, padding: 24 },
  modalTitle: { fontSize: 25, fontWeight: 'bold', marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 18, color: '#000', marginBottom: 8, fontWeight: '600' },
  passwordInputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#AFAFAF4D', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12 },
  inputWithIcon: { flex: 1, fontSize: 15, paddingVertical: 12 },
  eyeIcon: { paddingLeft: 10 },
  inputError: { borderColor: '#FF383C' },
  errorText: { color: '#FF383C', fontSize: 12, marginTop: 5, marginLeft: 2 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 15, marginRight: 10, borderColor: '#ffffff', borderWidth: 1, borderRadius: 10, minWidth: 70, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#FF383C', fontSize: 15, fontWeight: '700' },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 15, backgroundColor: '#E8E5FF', borderRadius: 10, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
  saveBtnDisabled: { backgroundColor: '#F5F5F5' },
  withdrawWarningBox: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 15, marginBottom: 20 },
  withdrawWarningText: { fontSize: 15, color: '#AFAFAF', lineHeight: 20 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  checkboxLabel: { fontSize: 13, color: '#AFAFAF', marginLeft: 8 },
  checkCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#E0D5FF99', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  doorCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 3,backgroundColor: '#E0D5FF99', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }, 
  successTitle: { fontSize: 25, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  successDesc: { fontSize: 15, color: '#AFAFAF', textAlign: 'center' },
  confirmBtn: { marginTop: 25, backgroundColor: '#E0D5FF99', width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' },
  confirmBtnText: { color: '#9747FF', fontWeight: '700', fontSize: 18 },
});