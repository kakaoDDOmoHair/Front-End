import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StaffProfileData } from './StaffData';

export default function StaffProfile({ data }: { data: StaffProfileData }) {
  if (!data) return null;

  return (
    <View style={localStyles.container}>
      <View style={localStyles.avatarCircle}>
        <Ionicons name="person" size={60} color="#FFFFFF" />
      </View>
      <Text style={localStyles.nameText}>{data.name}</Text>
      <Text style={localStyles.emailText}>{data.email}</Text>
      <Text style={localStyles.dateText}>{data.joinDate}</Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 20 },
  avatarCircle: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: '#E0D5FF99', justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    shadowColor: "#9747FF", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5,
  },
  nameText: { fontSize: 25, fontWeight: 'bold', color: '#000' },
  emailText: { fontSize: 15, color: '#AFAFAF', marginTop: 4, },
  dateText: { fontSize: 15, color: '#AFAFAF', marginTop: 4 },
});
