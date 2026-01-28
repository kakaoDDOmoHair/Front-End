import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BossNotificationItemData } from './BossData';

interface BossNotificationItemProps {
  data: BossNotificationItemData;
  onPress: () => void;
  // id가 number이므로 타입을 number로 수정합니다.
  onApprove?: (id: number) => void; 
  onReject?: (id: number) => void;
}

export const BossNotificationItem: React.FC<BossNotificationItemProps> = ({ 
  data, 
  onPress, 
  onApprove, 
  onReject 
}) => {
  
  return (
    <View style={itemStyles.container}>
      <TouchableOpacity 
        style={itemStyles.card} 
        activeOpacity={0.8}
        onPress={onPress}
      >
        <View style={itemStyles.mainRow}>
          <View style={itemStyles.contentContainer}>
            <Text style={itemStyles.iconText}>{data.icon}</Text>
            <Text style={itemStyles.categoryTag}>{data.name}</Text>
            <Text style={itemStyles.messageText} numberOfLines={2}>
              {data.message}
            </Text>
          </View>
          <Text style={itemStyles.timeText}>{data.time}</Text>
        </View>

        {/* hasActions가 true일 때만 승인/거절 버튼 표시 */}
        {data.hasActions && (
          <View style={itemStyles.buttonRow}>
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
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contentContainer: {
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
    flex: 1,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 12,
    color: '#0000004D',
    minWidth: 45,
    textAlign: 'right',
    marginTop: 10,
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