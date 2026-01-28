// components/notification/Data.ts

export interface NotificationItemData {
  id: number;
  icon: string;
  name: string;
  message: string;
  time: string;
  category: '오늘' | '어제' | '이번 주';
  isRead: boolean;
}


export const NOTIFICATIONS: NotificationItemData[] = [
  // --- 오늘 섹션 ---
  {
    id: 1,
    icon: '✍️',
    name: '작성',
    message: '사장님이 근로계약서를 보냈습니다. 내용을 확인하고 서명해 주세요.',
    time: '2시간 전',
    category: '오늘',
    isRead: false,
  },
  {
    id: 2,
    icon: '🎉',
    name: '완료',
    message: '계약 작성이 완료되었습니다! 이제 안전하게 근무를 시작해 보세요.',
    time: '2시간 전',
    category: '오늘',
    isRead: false,
  },
  {
    id: 3,
    icon: '📈',
    name: '급여',
    message: '지금까지 이만큼 모았어요! 이번 달 예상 월급 확인해 보세요. 💰',
    time: '2시간 전',
    category: '오늘',
    isRead: false,
  },

  // --- 어제 섹션 ---
  {
    id: 4,
    icon: '💵',
    name: '임금',
    message: '이번 달 급여 명세서가 도착했습니다. 한 달 동안 고생 많으셨어요!',
    time: '하루 전',
    category: '어제',
    isRead: true,
  },
  {
    id: 5,
    icon: '⏰',
    name: '출근',
    message: '(09:02) 출근 체크 완료! 오늘도 기분 좋은 하루 보내세요.',
    time: '하루 전',
    category: '어제',
    isRead: true,
  },
  {
    id: 6,
    icon: '🏠',
    name: '퇴근',
    message: '(18:00) 퇴근 체크 완료! 고생하셨습니다. 조심히 들어가세요!',
    time: '하루 전',
    category: '어제',
    isRead: true,
  },
];