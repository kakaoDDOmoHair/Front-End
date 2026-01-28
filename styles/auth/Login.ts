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
    resizeMode: 'contain', // 이미지가 잘리지 않고 정해진 크기 안에 쏙 들어가게 함
  },
  inputContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 25,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    fontSize: 12,
    color: '#ccc',
  },
  submitButtonContainer: {
    width: '100%',
  }
});