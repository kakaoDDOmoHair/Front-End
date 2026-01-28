export interface ManualStep {
  stepNumber: number;
  title: string;
  descriptions: string[];
}

export type Step = ManualStep;
export interface ManualItem {
  manualId: number;

  category: string;
  title: string;
  content?: string;
  steps?: ManualStep[];
}

export const STAFF_MANUAL_LIST: ManualItem[] = [
  {
    manualId: 1, // 숫자 ID로 변경
    category: "오픈",
    title: "매장 오픈 가이드 (예시)",
    content: "[포스기 세팅]\n전원을 켜주세요.",
    steps: [
      {
        stepNumber: 1,
        title: "포스기 및 장비 세팅",
        descriptions: [
          "포스기 오른쪽 하단 전원 버튼 클릭",
          "배달 앱(배민/쿠팡) 로그인 확인",
        ],
      },
    ],
  },
];
