import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// ✅ 기존 데이터 임포트 (초기값 혹은 데이터 구조 참조용)
import { BOSS_DATA, BUSINESS_DATA, BusinessData } from '../../../components/profile/BossData';
import { styles } from '../../../styles/tabs/boss/BossInfo';

/**
 * 1. 개별 정보 아이템 컴포넌트
 */
const InfoItem = ({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) => (
  <View style={[styles.itemRow, isLast && styles.lastItem]}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueContainer}>
      <Text style={styles.valueText}>{value || '미등록'}</Text>
    </View>
  </View>
);

/**
 * 2. 정보 섹션 그룹 컴포넌트
 */
const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.infoCard}>{children}</View>
  </View>
);

export default function BossInfoPage() {
  const router = useRouter();
  
  // ✅ 매장 정보를 관리할 상태 (State)
  const [storeInfo, setStoreInfo] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * ✅ 데이터 로드 로직
   * 로그인 후 서버에서 매장 정보를 가져오거나, 
   * AsyncStorage 등에 저장된 등록 정보를 가져오는 시뮬레이션입니다.
   */
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        // TODO: 여기서 실제 API 호출을 진행합니다.
        // const response = await api.get('/store/info');
        
        // 현재는 기존 데이터를 불러오는 것으로 대체합니다.
        setTimeout(() => {
          setStoreInfo(BUSINESS_DATA);
          setLoading(false);
        }, 800); // 0.8초 로딩 시뮬레이션
      } catch (error) {
        console.error("데이터 로드 실패:", error);
        setLoading(false);
      }
    };

    fetchStoreData();
  }, []);

  // 로딩 중일 때 보여줄 화면
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9747FF" />
        <Text style={{ marginTop: 10, color: '#AFAFAF' }}>정보를 불러오는 중입니다...</Text>
      </SafeAreaView>
    );
  }

  // 데이터가 없을 때 (매장 등록 전)
  if (!storeInfo) {
    return (
      <SafeAreaView style={styles.container}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={28} color="#000" /></TouchableOpacity>
            <Text style={styles.headerTitle}>사업자 정보</Text>
            <View style={{ width: 28 }} />
         </View>
         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: '#666', marginBottom: 20 }}>등록된 매장 정보가 없습니다.</Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#E0D5FF', padding: 15, borderRadius: 10 }}
              onPress={() => router.push('/boss/Registration')} 
            >
              <Text style={{ color: '#9747FF', fontWeight: 'bold' }}>매장 등록하러 가기</Text>
            </TouchableOpacity>
         </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>사업자 정보</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. 상단 프로필 요약 (BOSS_DATA 사용) */}
        <View style={styles.profileSummary}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={45} color="#FFFFFF" />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.nameText}>{BOSS_DATA.name} {BOSS_DATA.role}</Text>
            <Text style={styles.shopText}>상호명 00점</Text>
          </View>
        </View>

        {/* 2. 상세 정보 섹션들 (동적 데이터 storeInfo 사용) */}
        <InfoSection title="기본 정보">
          <InfoItem label="사업자 번호" value={storeInfo.businessNumber} />
          <InfoItem label="개업 연월일" value={storeInfo.openingDate} />
          <InfoItem label="업태/업종" value={storeInfo.businessType} isLast />
        </InfoSection>

        <InfoSection title="운영 정보">
          <InfoItem label="매장 주소" value={storeInfo.address} />
          <InfoItem label="매장 전화번호" value={storeInfo.phone} />
          <InfoItem label="매장 WIFI" value={storeInfo.wifi} isLast />
        </InfoSection>

        <InfoSection title="정산 정보">
          <InfoItem label="급여 정산일" value={storeInfo.settlementDate} />
          <InfoItem label="정산 계좌정보" value={storeInfo.accountInfo} isLast />
        </InfoSection>

      </ScrollView>
    </SafeAreaView>
  );
}