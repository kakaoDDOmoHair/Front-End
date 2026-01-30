/**
 * 공통 계약서 데이터 인터페이스
 * 사장님과 알바생 모두 사용
 */
export interface ContractData {
  id: string;
  name: string;
  location: string;
  status: string;
  wage: number;
  isResigned: boolean;
  fileUrl?: string;
  // 알바생 화면용 추가 필드
  workingHours?: string;
  contractPeriod?: string;
  approvedDate?: string;
  resignedDate?: string;
}

/**
 * 공통 더미 데이터
 * 사장님이 등록한 계약서 = 알바생이 조회하는 계약서
 */
export const DUMMY_CONTRACTS: ContractData[] = [
  {
    id: "1",
    name: "김현아",
    location: "GS25 제주본점",
    status: "계약 중",
    wage: 11000,
    isResigned: false,
    fileUrl: undefined,
    workingHours: "주 12시간",
    contractPeriod: "2026-01-20 ~ 2027-01-20",
    approvedDate: "2026-01-15",
  },
];
