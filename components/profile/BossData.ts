// 1. 사장님 개인 프로필 인터페이스
export interface BossProfileData {
  name: string;
  role: string;
  email: string;
}

// 2. 사업장 상세 정보 인터페이스
export interface BusinessData {
  businessNumber: string;
  openingDate: string;
  businessType: string;
  address: string;
  phone: string;
  wifi: string;
  settlementDate: string;
  accountInfo: string;
}

// ✅ 사장님 개인 데이터
export const BOSS_DATA: BossProfileData = {
  name: "김도홍",
  role: "사장님",
  email: "2023108107@gmail.com",
};

// ✅ 사업장 상세 데이터 (따로 분리)
export const BUSINESS_DATA: BusinessData = {
  businessNumber: "000-00-00000",
  openingDate: "2023-10-01",
  businessType: "서비스업/보드게임 카페",
  address: "제주특별자치도 제주시 어쩌고저쩌고고고",
  phone: "012-345-678",
  wifi: "Kakao_PayMate",
  settlementDate: "매월 5일",
  accountInfo: "00은행 123-456-789012"
};