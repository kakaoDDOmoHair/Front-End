export interface BossNotificationItemData {
  id: number;
  icon: string;
  name: string;      // 보라색 강조 텍스트 (계약, 안내, 정산 등)
  message: string;
  time: string;
  category: '오늘' | '어제' | '이번 주';
  isRead: boolean;
  hasActions?: boolean; // 승인/거절 버튼 표시 여부
  /** 정렬용(최신 위) — ISO 문자열 */
  sortAt?: string;
}

export const BOSS_NOTIFICATIONS: BossNotificationItemData[] = [
  // --- 오늘 섹션 ---
  {
    id: 1,
    icon: '📄',
    name: '계약',
    message: '새로운 근로계약서가 도착했습니다. 승인 후 계약을 확정하세요.',
    time: '2시간 전',
    category: '오늘',
    isRead: false,
  },
  {
    id: 2,
    icon: '📅',
    name: '안내',
    message: '내일은 급여 정산일입니다. 누락된 근무 기록이 없는지 확인해 보세요.',
    time: '2시간 전',
    category: '오늘',
    isRead: false,
  },
  {
    id: 3,
    icon: '💰',
    name: '정산',
    message: '이번 달 지급할 총 급여 계산이 완료되었습니다. 내역을 확인하세요.',
    time: '2시간 전',
    category: '오늘',
    isRead: false,
  },

  // --- 어제 섹션 ---
  {
    id: 4,
    icon: '🏠',
    name: '퇴근',
    message: '도홍님이 퇴근했습니다. (18:00) 총 6시간 근무했습니다.',
    time: '하루 전',
    category: '어제',
    isRead: true,
  },
  {
    id: 5,
    icon: '⚠️',
    name: '지각',
    message: '도홍님이 예정된 시간보다 늦게 출근했습니다. (09:30)',
    time: '2시간 전',
    category: '어제',
    isRead: true,
  },
  {
    id: 6,
    icon: '⏰',
    name: '출근',
    message: '도홍님이 출근했습니다. (09:00) 오늘도 힘찬 하루 되세요!',
    time: '하루 전',
    category: '어제',
    isRead: true,
  },

  // --- 이번 주 섹션 ---
  {
    id: 7,
    icon: '⏰',
    name: '근무',
    message: '도홍님이 1월 6일 근무 시간 수정을 요청했습니다. 확인 후 승인해 주세요.',
    time: '하루 전',
    category: '이번 주',
    isRead: true,
    hasActions: true, // 이미지 하단의 거절/승인 버튼 활성화용
  },
];