import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

export const CustomInput = forwardRef<
  TextInput,
  TextInputProps & { icon?: keyof typeof Ionicons.glyphMap; style?: ViewStyle }
>(({ icon, style, ...props }, ref) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <TextInput
        ref={ref}
        style={styles.input}
        placeholderTextColor="#AFAFAF"
        autoCapitalize="none"
        {...props}
      />
      {icon && (
        <Ionicons name={icon} size={20} color="#6C5CE7" style={styles.icon} />
      )}
    </View>
  );
});

CustomInput.displayName = "CustomInput";
const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: "#FFFFFF", // 안쪽 배경색을 흰색으로 변경
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    // 테두리 설정 추가
    borderWidth: 1, // 테두리 두께
    borderColor: "#000000", // 테두리 색상을 검은색으로 변경
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000000", // 입력하는 글자 색상을 검은색으로 설정
    paddingVertical: 0,
  },
  icon: {
    marginLeft: 10,
  },
});
