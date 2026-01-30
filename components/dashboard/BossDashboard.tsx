import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScheduleDay, Worker } from './Data';

export interface TodayAttendanceItem {
  userId: number;
  name: string;
  status: 'ON' | 'OFF' | 'LATE' | 'ABSENT';
}

const getStatusLabel = (status: TodayAttendanceItem['status']) => {
  switch (status) {
    case 'ON':
      return '근무 중';
    case 'LATE':
      return '지각';
    case 'ABSENT':
      return '결근';
    default:
      return '퇴근';
  }
};

const getStatusColor = (status: TodayAttendanceItem['status']) => {
  switch (status) {
    case 'ON':
      return '#34C759';
    case 'LATE':
      return '#FFCC00';
    case 'ABSENT':
      return '#FF3B30';
    default:
      return '#BDBDBD';
  }
};

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

export const TodayAttendanceCard = ({
  data,
  totalPay,
}: {
  data: TodayAttendanceItem[];
  totalPay: number;
}) => (
  <View style={[compStyles.card, compStyles.todayCard]}>
    <Text style={compStyles.cardTitle}>실시간 현황</Text>
    <Text style={compStyles.cardSubText}>
      예상 급여 {totalPay.toLocaleString()}원
    </Text>
    <View style={compStyles.todayList}>
      {data.length === 0 ? (
        <Text style={compStyles.emptyText}>오늘 근무자가 없습니다</Text>
      ) : (
        data.map((item) => (
          <View key={item.userId} style={compStyles.todayRow}>
            <Text style={compStyles.todayName}>{item.name}</Text>
            <View style={compStyles.statusRow}>
              <View
                style={[
                  compStyles.statusDot,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              />
              <Text style={compStyles.statusText}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  </View>
);

// 2. 시간표 카드
export const ScheduleCard = ({ data }: { data: ScheduleDay }) => {
  
  // 이름 기반으로 고정된 랜덤 색상 선택
  const getStaffStyle = (name: string) => {
    const palette = [
      compStyles.tagBlue,
      compStyles.tagRed,
      compStyles.tagBoss,
      compStyles.tagPink,
      compStyles.tagYellow,
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
      hash = (hash * 31 + name.charCodeAt(i)) % palette.length;
    }
    return palette[hash];
  };

  return (
    <View style={[compStyles.card, compStyles.scheduleCard]}>
      <Text style={compStyles.cardTitle}>{data.day}</Text>
      <View style={compStyles.divider} />
      {data.schedules.length === 0 ? (
        <Text style={compStyles.emptyScheduleText}>일정 없음</Text>
      ) : (
        data.schedules
          .slice()
          .sort((a, b) => {
            const getStartMinutes = (time: string) => {
              const cleaned = time.replace(/\s/g, "");
              const start = cleaned.split("~")[0]?.split("-")[0] || cleaned;
              const [h, m] = start.split(":").map((v) => Number(v));
              if (Number.isNaN(h) || Number.isNaN(m)) return 0;
              return h * 60 + m;
            };
            return getStartMinutes(a.time) - getStartMinutes(b.time);
          })
          .map((item, idx) => (
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
        ))
      )}
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
  
  todayCard: { width: 280, height: 'auto' },
  todayList: { gap: 8 },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  todayName: { fontSize: 14, fontWeight: '600', color: '#000' },
  emptyText: { fontSize: 13, color: '#AFAFAF' },

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
  emptyScheduleText: { fontSize: 13, color: '#AFAFAF' },

  tabItem: { alignItems: 'center' },
  tabLabel: { fontSize: 12, marginTop: 4, color: '#000000' },
});