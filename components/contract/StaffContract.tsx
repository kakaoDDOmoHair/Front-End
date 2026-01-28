import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/tabs/staff/Contract';
import { ContractData } from './StaffData';

interface StaffContractProps {
  data: ContractData;
  onViewOriginal: () => void;
}

export const StaffContract: React.FC<StaffContractProps> = ({ data, onViewOriginal }) => {
  return (
    <View style={styles.contractWrapper}>
      {/* 1. 상단 카드: 매장 정보 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>매장명 : {data.location}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: data.isResigned ? '#D3D3D3' : '#CB30E0' }]} />
          <Text style={styles.statusText}>
            등록 완료 {data.isResigned ? data.resignedDate : (data.approvedDate || '2026-01-20')}
          </Text>
        </View>
      </View>

      {/* 2. 운영 정보 섹션: 카드 외부 분리 */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>운영 정보</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>시급</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>{data.wage.toLocaleString()}원</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>근로시간</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>{data.workingHours}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>계약기간</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>
                {data.isResigned ? '계약 종료' : `${data.contractPeriod}`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. 하단 버튼 */}
      <TouchableOpacity style={styles.viewButton} onPress={onViewOriginal}>
        <Text style={styles.viewButtonText}>계약서 원본 보기</Text>
      </TouchableOpacity>
    </View>
  );
};