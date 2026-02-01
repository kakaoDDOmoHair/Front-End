import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BossNotificationItemData } from './BossData';

interface BossNotificationItemProps {
  data: BossNotificationItemData;
  onPress: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

export const BossNotificationItem: React.FC<BossNotificationItemProps> = ({
  data,
  onPress,
  onApprove,
  onReject,
}) => {
  
  return (
    <View style={itemStyles.container}>
      <TouchableOpacity 
        style={itemStyles.card} 
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={itemStyles.topRow}>
          <View style={itemStyles.titleRow}>
            <Text style={itemStyles.iconText}>{data.icon}</Text>
            <Text style={itemStyles.categoryTag}>{data.name}</Text>
          </View>
          <Text style={itemStyles.timeText}>{data.time}</Text>
        </View>
        <Text style={itemStyles.messageText}>
          {data.message}
        </Text>

        {/* 수락/거절 후: "수락됨" 또는 "거절됨" 표시, 대기 중일 때만 승인/거절 버튼 */}
        {(data.hasActions || data.requestStatus) && (
          <View style={itemStyles.buttonRow}>
            {data.requestStatus === 'APPROVED' ? (
              <Text style={itemStyles.statusText}>수락됨</Text>
            ) : data.requestStatus === 'REJECTED' ? (
              <Text style={[itemStyles.statusText, { color: '#666' }]}>거절됨</Text>
            ) : (
              <>
                <TouchableOpacity
                  style={itemStyles.actionButton}
                  onPress={() => onReject?.(data.id)}
                >
                  <Text style={[itemStyles.actionButtonText, { color: '#FF383C' }]}>거절</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={itemStyles.actionButton}
                  onPress={() => onApprove?.(data.id)}
                >
                  <Text style={[itemStyles.actionButtonText, { color: '#0088FF' }]}>승인</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        {!data.isRead && <View style={itemStyles.unreadBadge} />}
      </TouchableOpacity>
    </View>
  );
};

const itemStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#F3F3F3',
    borderRadius: 15, // 약간 더 부드러운 곡선
    paddingHorizontal: 16,
    paddingVertical: 18,
    position: 'relative',
    // 그림자 효과 추가 (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // 그림자 효과 추가 (Android)
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  iconText: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryTag: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9747FF',
    marginRight: 15,
  },
  messageText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
    lineHeight: 22,
  },
  comparisonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
    flexWrap: 'wrap',
  },
  comparisonBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#EEEEEE',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '600',
  },
  comparisonValue: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#0000004D',
    minWidth: 45,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0D5FF4D', // 버튼 테두리 추가로 더 깔끔하게
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '400',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0088FF',
  },
  unreadBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 50,
    backgroundColor: '#FF383C',
  },
});