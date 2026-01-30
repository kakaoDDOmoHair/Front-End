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
      <View
        style={[
          compStyles.statusDot,
          {
            backgroundColor:
              data.status === 'working'
                ? '#34C759'
                : data.status === 'late'
                  ? '#FFCC00'
                  : '#FF3B30',
          },
        ]}
      />
      <Text style={compStyles.statusText}>
        {data.status === 'working'
          ? '출근 완료'
          : data.status === 'late'
            ? '지각'
            : '결근'}
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
  const staffPalette = [
    compStyles.tagBlue,
    compStyles.tagRed,
    compStyles.tagBoss,
    compStyles.tagPink,
    compStyles.tagYellow,
  ];

  // 같은 줄에서 색이 겹치지 않도록 인덱스 기반으로 순환
  const getStaffStyleByIndex = (index: number) => {
    const safeIndex = Number.isFinite(index) ? index : 0;
    return staffPalette[safeIndex % staffPalette.length];
  };

  const parseTimeValue = (value: string) => {
    if (!value) return null;
    const raw = value.trim();
    if (!raw) return null;
    if (raw.includes(":")) {
      const [h, m] = raw.split(":").map((v) => Number(v));
      if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
      if (h < 0 || h > 23 || m < 0 || m > 59) return null;
      return h * 60 + m;
    }
    if (/^\d{1,2}$/.test(raw)) {
      const h = Number(raw);
      if (h < 0 || h > 23) return null;
      return h * 60;
    }
    if (/^\d{3,4}$/.test(raw)) {
      const padded = raw.padStart(4, "0");
      const h = Number(padded.slice(0, 2));
      const m = Number(padded.slice(2));
      if (h < 0 || h > 23 || m < 0 || m > 59) return null;
      return h * 60 + m;
    }
    return null;
  };

  const parseTimeRange = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const parts = cleaned.includes("~") ? cleaned.split("~") : cleaned.split("-");
    if (parts.length < 2) return null;
    const start = parseTimeValue(parts[0]);
    const end = parseTimeValue(parts[1]);
    if (start == null || end == null) return null;
    if (end <= start) return null;
    return { start, end };
  };

  const parsedSchedules = data.schedules
    .map((item) => {
      const range = parseTimeRange(item.time);
      return range
        ? { ...range, staff: item.staff, time: item.time }
        : null;
    })
    .filter((item): item is { start: number; end: number; staff: string[]; time: string } => Boolean(item));

  const canRenderTimeline =
    parsedSchedules.length > 0 && parsedSchedules.length === data.schedules.length;

  const scheduleTimeline =
    canRenderTimeline && parsedSchedules.length > 0
      ? (() => {
          const sorted = parsedSchedules.slice().sort((a, b) => a.start - b.start);
          const minStart = Math.min(...sorted.map((s) => s.start));
          const maxEnd = Math.max(...sorted.map((s) => s.end));
          const totalMinutes = Math.max(60, maxEnd - minStart);

          const lanes: number[] = [];
          const withLane = sorted.map((item) => {
            let laneIndex = lanes.findIndex((end) => end <= item.start);
            if (laneIndex === -1) {
              laneIndex = lanes.length;
              lanes.push(item.end);
            } else {
              lanes[laneIndex] = item.end;
            }
            return { ...item, laneIndex };
          });

          return { minStart, maxEnd, totalMinutes, lanesCount: lanes.length, items: withLane };
        })()
      : null;

  return (
    <View style={[compStyles.card, compStyles.scheduleCard]}>
      <Text style={compStyles.cardTitle}>{data.day}</Text>
      <View style={compStyles.divider} />
      {data.schedules.length === 0 ? (
        <Text style={compStyles.emptyScheduleText}>일정 없음</Text>
      ) : (
        scheduleTimeline ? (
          <View style={compStyles.scheduleTimelineContainer}>
            <View style={compStyles.scheduleTimeColumn}>
              <Text style={compStyles.scheduleTimeLabel}>
                {`${Math.floor(scheduleTimeline.minStart / 60)
                  .toString()
                  .padStart(2, "0")}:${String(scheduleTimeline.minStart % 60).padStart(2, "0")}`}
              </Text>
              <Text style={compStyles.scheduleTimeLabel}>
                {`${Math.floor(
                  (scheduleTimeline.minStart + scheduleTimeline.totalMinutes / 2) / 60,
                )
                  .toString()
                  .padStart(2, "0")}:${String(
                  Math.round(
                    (scheduleTimeline.minStart + scheduleTimeline.totalMinutes / 2) % 60,
                  ),
                ).padStart(2, "0")}`}
              </Text>
              <Text style={compStyles.scheduleTimeLabel}>
                {`${Math.floor(scheduleTimeline.maxEnd / 60)
                  .toString()
                  .padStart(2, "0")}:${String(scheduleTimeline.maxEnd % 60).padStart(2, "0")}`}
              </Text>
            </View>
            <View style={compStyles.scheduleTrack}>
              {scheduleTimeline.items.map((item, idx) => {
                const top =
                  ((item.start - scheduleTimeline.minStart) /
                    scheduleTimeline.totalMinutes) *
                  110;
                const height = Math.max(
                  18,
                  ((item.end - item.start) / scheduleTimeline.totalMinutes) * 110,
                );
                const widthPercent = 100 / scheduleTimeline.lanesCount;
                const leftPercent = item.laneIndex * widthPercent;
                return (
                  <View
                    key={`${item.time}-${idx}`}
                    style={[
                      compStyles.scheduleBar,
                      {
                        top,
                        height,
                        width: `${widthPercent}%`,
                        left: `${leftPercent}%`,
                      },
                    ]}
                  >
                    <Text style={compStyles.scheduleBarText} numberOfLines={1}>
                      {item.staff.join(", ")}
                    </Text>
                    <Text style={compStyles.scheduleBarTime}>{item.time}</Text>
                  </View>
                );
              })}
            </View>
          </View>
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
                      <View
                        key={sIdx}
                        style={[compStyles.tag, getStaffStyleByIndex(sIdx)]}
                      >
                        <Text style={compStyles.tagText}>{staff}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))
        )
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

  scheduleCard: { width: 280, height: 'auto', justifyContent: 'flex-start', minHeight: 190 },
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
  scheduleTimelineContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  scheduleTimeColumn: {
    width: 44,
    justifyContent: 'space-between',
    height: 110,
  },
  scheduleTimeLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'right',
  },
  scheduleTrack: {
    flex: 1,
    height: 110,
    position: 'relative',
    backgroundColor: '#F7F7FB',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  scheduleBar: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E0D5FF',
    borderWidth: 1,
    borderColor: '#C9B7FF',
  },
  scheduleBarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
  },
  scheduleBarTime: {
    fontSize: 10,
    color: '#555',
  },

  tabItem: { alignItems: 'center' },
  tabLabel: { fontSize: 12, marginTop: 4, color: '#000000' },
});