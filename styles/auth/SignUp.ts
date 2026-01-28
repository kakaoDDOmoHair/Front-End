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
  },
  logoImage: {
    width: 200,
    height: 132,
    resizeMode: 'contain',
  },
  inputContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 15,
  },
  roleSelectionContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 15,
  },
  roleButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#EBE6FF',
    borderStyle: 'dashed', // 디자인 시안의 점선 효과
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedRoleButton: {
    backgroundColor: '#EBE6FF',
    borderStyle: 'solid',
    width: 150,
    height: 40,
  },
  roleButtonText: {
    fontSize: 14,
    color: '#D1C4FF',
  },
  selectedRoleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButtonContainer: {
    width: '100%',
  }
});