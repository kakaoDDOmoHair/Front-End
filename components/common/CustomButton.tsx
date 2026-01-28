import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface Props extends TouchableOpacityProps {
  title: string; // 버튼에 표시할 텍스트
  onPress: () => void;
}

export const CustomButton = ({ title, onPress, ...props }: Props) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 40,
    backgroundColor: '#EBE6FF', // PayMate 메인 테마 색상
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
});