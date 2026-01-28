/** * 사장님용 근로계약서 데이터 인터페이스 
 */
export interface ContractData {
  id: string;
  name: string;           // 알바생 이름
  location: string;       // 근무 매장명
  status: '계약 중' | '만료' | '해지';
  wage: number;           // 시급
  isResigned: boolean;    // 퇴사 여부
  resignedDate?: string;  // 퇴사 날짜 ('YYYY-MM-DD' 형식)
  imageUrl?: string;      // ✅ 필드명 통일: imageUrl
  pdfUrl?: string;        // ✅ PDF 다운로드 경로 추가
}

// 초기 관리 리스트 데이터
export const CONTRACT_DATA: ContractData[] = [
  { 
    id: '1', name: '김철수', location: '제주공항점', status: '계약 중', wage: 11000, isResigned: false, 
    imageUrl: 'https://via.placeholder.com/400x600', 
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  { 
    id: '2', name: '이영희', location: '서귀포점', status: '계약 중', wage: 11000, isResigned: false, 
    imageUrl: 'https://via.placeholder.com/400x600', 
    // ⚠️ 여기에도 테스트용 PDF 주소를 넣어주세요
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 
  },
  { 
    id: '3', name: '박지성', location: '제주공항점', status: '해지', wage: 11000, isResigned: true, resignedDate: '2025-12-30', 
    imageUrl: 'https://via.placeholder.com/400x600', 
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
];