import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NotificationItemData } from './StaffData';

interface NotificationItemProps {
  data: NotificationItemData;
  onPress: () => void; // 클릭 시 읽음 처리를 위한 이벤트 추가
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ data, onPress }) => {
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
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 18,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  timeText: {
    fontSize: 12,
    color: '#0000004D',
    minWidth: 45,
    textAlign: 'right',
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