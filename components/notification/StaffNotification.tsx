import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NotificationItemData } from './StaffData';

interface NotificationItemProps {
  data: NotificationItemData;
  onPress: () => void; // 클릭 시 읽음 처리를 위한 이벤트 추가
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ data, onPress }) => {
  return (
    <TouchableOpacity 
      style={itemStyles.card} 
      activeOpacity={0.8}
      onPress={onPress} // 터치 시 부모 컴포넌트의 handleNotificationPress 실행
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

      {/* 읽지 않음 상태(!data.isRead)일 때만 빨간색 배지 표시 */}
      {!data.isRead && <View style={itemStyles.unreadBadge} />}
    </TouchableOpacity>
  );
};

const itemStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#F3F3F3', // 이미지의 연한 회색 배경
    borderRadius: 15,           // 둥근 모서리
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginHorizontal: 16,
    marginBottom: 10,
    position: 'relative',       // 배지(unreadBadge) 배치를 위한 기준점
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
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // 메시지가 길어질 경우 대비
    paddingRight: 8,
  },
  iconText: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryTag: {
    fontSize: 18,
    fontWeight: '700',
    color: '#9747FF', // 이미지의 시그니처 보라색
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
    color: '#0000004D', // 이미지의 반투명 검정색
    minWidth: 45,
    textAlign: 'right',
    marginTop: -3

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