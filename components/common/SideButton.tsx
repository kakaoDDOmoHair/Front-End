import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface SideButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: object;
}

export const SideButton = ({ title, onPress }: SideButtonProps) => (
  <TouchableOpacity style={localStyles.sideButton} onPress={onPress}>
    <Text style={localStyles.sideButtonText}>{title}</Text>
  </TouchableOpacity>
);

const localStyles = StyleSheet.create({
  sideButton: {
    width: 90,
    height: 50,
    backgroundColor: "#EBE6FF",
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    marginBottom: 10,
  },
  sideButtonText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "600",
  },
});
