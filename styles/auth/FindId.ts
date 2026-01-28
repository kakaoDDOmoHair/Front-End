import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 132,
    resizeMode: 'contain',
  },
  inputContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 25,
  },
  submitButtonContainer: {
    width: '100%',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  linkText: {
    fontSize: 15,
    color: '#666',
  },
  // 🔥 아이디 결과창 전용 스타일
  resultContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 30,
  },
  resultText: {
    fontSize: 15,
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
    marginTop: 10,
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    backgroundColor: '#EBE6FF',
    borderRadius: 10,
    height: 40,
  },
  smallButtonText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 검은 배경
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    // 그림자 효과 (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // 그림자 효과 (Android)
    elevation: 5,
  },
  modalLogoContainer: {
    marginBottom: 20,
  },
  modalLogoImage: {
    width: 120,
    height: 80,
    resizeMode: 'contain',
  },
  
});
