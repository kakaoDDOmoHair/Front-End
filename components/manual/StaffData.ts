// components/manual/StaffData.ts
export interface ManualStep {
  stepNumber: number;
  title: string;
  descriptions: string[];
}

export interface ManualItem {
  id: string;
  category: string;
  title: string;
  steps?: ManualStep[];
}

export const STAFF_MANUAL_LIST: ManualItem[] = [
  {
    id: '1',
    category: '오픈',
    title: '매장 오픈 가이드',
    steps: [
      {
        stepNumber: 1,
        title: '포스기 및 장비 세팅',
        descriptions: ['포스기 오른쪽 하단 전원 버튼 클릭', '배달 앱(배민/쿠팡) 로그인 확인'],
      },
      {
        stepNumber: 2,
        title: '매장 조명 및 음악',
        descriptions: ["주방 입구 왼쪽 스위치 4개 모두 ON", "아이패드 'Melon' 앱 재생 버튼 클릭"],
      },
      {
        stepNumber: 3,
        title: '시재 점검',
        descriptions: ['시재 서랍을 열어 5만원권 확인...'],
      },
    ],
  },
  { id: '2', category: '결제', title: '분할 결제 방법', steps: [] },
  { id: '3', category: '마감', title: '화장실 청소', steps: [] },
];