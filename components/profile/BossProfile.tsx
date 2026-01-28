import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BossProfileData } from './BossData';

interface BossProfileProps {
  data: BossProfileData;
}

const BossProfile = ({ data }: BossProfileProps) => {
  // ✅ 에러 방지: data가 없을 경우 앱이 멈추지 않게 처리합니다.
  if (!data) return null;

  return (
    <View style={profileStyles.container}>
      <View style={profileStyles.avatarCircle}>
        <Ionicons name="person" size={60} color="#FFFFFF" />
      </View>
      
      <Text style={profileStyles.nameText}>
        {data.name} {data.role}
      </Text>
      <Text style={profileStyles.emailText}>{data.email}</Text>
    </View>
  );
};

const profileStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: '#E0D5FF99',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#9747FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  nameText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  emailText: {
    fontSize: 15,
    color: '#AFAFAF',
  },
});

export default BossProfile;