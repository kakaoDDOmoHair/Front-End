import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/tabs/boss/Contract';
import { ContractData } from './BossData';

interface BossContractProps {
  data: ContractData;
  onDelete: (id: string) => void; // 삭제 기능을 위한 콜백 함수
}

export const BossContract: React.FC<BossContractProps> = ({ data, onDelete }) => {
  
  // 1. 계약서 열람 로직
  const handleView = () => {
    Alert.alert('계약서 열람', `${data.name} 님의 근로계약서를 불러옵니다.`);
  };

  // 2. 다운로드 로직
  const handleDownload = () => {
    Alert.alert('다운로드', `${data.name}_계약서.pdf 파일을 기기에 저장하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: () => Alert.alert('알림', '다운로드가 완료되었습니다.') }
    ]);
  };

  // 3. 삭제 로직
  const handleDelete = () => {
    Alert.alert('계약 삭제', `${data.name} 님의 데이터를 목록에서 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`, [
      { text: '취소', style: 'cancel' },
      { 
        text: '삭제', 
        style: 'destructive', 
        onPress: () => {
          onDelete(data.id); // 부모 컴포넌트의 삭제 함수 호출
          Alert.alert('알림', '삭제가 완료되었습니다.');
        } 
      }
    ]);
  };

  // 버튼 정보 배열 (라벨과 기능을 매핑)
  const buttonConfigs = [
    { label: '계약서 열람', onPress: handleView },
    { label: '다운', onPress: handleDownload },
    { label: '삭제', onPress: handleDelete },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{data.name} ({data.location})</Text>
      
      <View style={styles.statusRow}>
        {/* 두 번째 코드의 더 밝은 색상 반영 (#D3D3D3, #CB30E0) */}
        <View style={[styles.statusDot, { backgroundColor: data.isResigned ? '#D3D3D3' : '#CB30E0' }]} />
        <Text style={styles.statusText}>{data.status} | {data.wage.toLocaleString()}원</Text>
      </View>

      <View style={styles.buttonRow}>
        {/* .map()을 활용한 효율적인 버튼 렌더링 */}
        {buttonConfigs.map((btn) => (
          <TouchableOpacity 
            key={btn.label} 
            style={styles.actionButton} 
            onPress={btn.onPress}
          >
            <Text style={styles.actionButtonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};