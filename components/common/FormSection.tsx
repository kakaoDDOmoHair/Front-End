import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

export const FormSection = ({ title, children }: FormSectionProps) => {
  return (
    <View style={localStyles.container}>
      <Text style={localStyles.sectionTitle}>{title}</Text>
      <View style={localStyles.sectionCard}>{children}</View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
  sectionCard: {
    backgroundColor: "#F7F7F7",
    borderRadius: 15,
    padding: 15,
  },
});
