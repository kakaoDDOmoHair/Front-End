import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScheduleDay, Worker } from './Data';

// 1. 근무자 카드
export const WorkerCard = ({ data }: { data: Worker }) => (
  <View style={compStyles.card}>
    <Text style={compStyles.cardTitle}>{data.name}</Text>
    <Text style={compStyles.cardSubText}>{data.time}</Text>
    <View style={compStyles.statusRow}>
      <View style={[compStyles.statusDot, { backgroundColor: data.status === 'working' ? '#34C759' : '#FFCC00' }]} />
      <Text style={compStyles.statusText}>
        {data.status === 'working' ? '출근 완료' : '지각 & 출근 완료'}
      </Text>
    </View>
  </View>
);

// 2. 시간표 카드
export const ScheduleCard = ({ data }: { data: ScheduleDay }) => {
  
  // 이름을 넣으면 맞는 스타일을 반환하는 도우미 함수
  const getStaffStyle = (name: string) => {
    switch (name) {
      case '도홍': return compStyles.tagBlue;
      case '현아': return compStyles.tagRed;
      case '사장': return compStyles.tagBoss;
      case '지운': return compStyles.tagPink;
      case '준영': return compStyles.tagYellow;
      default: return compStyles.tagBlue; // 그 외의 이름은 기본 파란색
    }
  };

  return (
    <View style={[compStyles.card, compStyles.scheduleCard]}>
      <Text style={compStyles.cardTitle}>{data.day}</Text>
      <View style={compStyles.divider} />
      {data.schedules.map((item, idx) => (
        <View key={idx} style={compStyles.scheduleRow}>
          <View style={compStyles.timelineDot} />
          <View>
            <Text style={compStyles.scheduleTime}>{item.time}</Text>
            <View style={compStyles.tagContainer}>
              {item.staff.map((staff, sIdx) => (
                <View key={sIdx} style={[
                  compStyles.tag,
                  getStaffStyle(staff)
                ]}>
                  <Text style={compStyles.tagText}>{staff}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// 3. 탭 아이템
export const TabItem = ({ icon, label, active }: { icon: any, label: string, active?: boolean }) => (
  <TouchableOpacity style={compStyles.tabItem}>
    <Ionicons name={icon} size={24} color={active ? '#A55EEA' : '#000'} />
    <Text style={[compStyles.tabLabel, active && { color: '#A55EEA' }]}>{label}</Text>
  </TouchableOpacity>
);

const compStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: 150,
    height: 150,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0D5FF99',
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold' },
  cardSubText: { fontSize: 15, color: '#000' },
  statusRow: { flexDirection: 'row', alignItems: 'center'},
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, color: '#000', fontWeight: '600' },
  
  scheduleCard: { width: 280, height: 'auto', justifyContent: 'flex-start' },
  divider: { height: 1, marginVertical: 15 },
  scheduleRow: { flexDirection: 'row', marginBottom: 15,paddingLeft: 15, position: 'relative' },
  timelineDot: { position: 'absolute', left: -5, top: 5, width: 7, height: 7, borderRadius: 5, backgroundColor: '#D3D3D3' },
  scheduleTime: { fontSize: 15, fontWeight: '600', marginBottom: 5 },
  tagContainer: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 15 },
  tagBlue: { backgroundColor: '#B9D4FF' },
  tagRed: { backgroundColor: '#E5C1C5' },
  tagBoss: { backgroundColor: '#CCFFB9' },
  tagPink: { backgroundColor: '#E0D5FF' },
  tagYellow: { backgroundColor: '#ECE8BC' },
  tagText: { fontSize: 12, fontWeight: '600', color: '#000' },

  tabItem: { alignItems: 'center' },
  tabLabel: { fontSize: 12, marginTop: 4, color: '#000000' },
});