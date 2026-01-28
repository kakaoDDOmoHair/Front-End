// components/manual/BossData.ts
export interface Step {
  stepNumber: number;
  title: string;
  descriptions: string[];
}

export interface ManualItem {
  id: string;
  category: string;
  title: string;
  steps?: Step[];
}

export const BOSS_MANUAL_LIST: ManualItem[] = [
  {
    id: '1',
    category: '오픈',
    title: '매장 오픈 체크리스트',
    steps: [
      { stepNumber: 1, title: '포스기 전원 확인', descriptions: ['메인 포스기 전원을 켭니다.', '카드 단말기 연결을 확인합니다.'] },
      { stepNumber: 2, title: '매장 청소', descriptions: ['바닥 및 테이블을 정리합니다.'] },
    ]
  },
  { id: '2', category: '결제', title: '분할 결제 방법', steps: [] },
  { id: '3', category: '야간', title: '화장실 청소', steps: [] },
];