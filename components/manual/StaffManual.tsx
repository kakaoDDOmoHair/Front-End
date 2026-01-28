// components/manual/StaffManual.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// 스타일 파일 경로에 맞춰 import 확인이 필요합니다.
import { styles } from '../../styles/tabs/staff/Manual';
import { ManualItem, STAFF_MANUAL_LIST } from './StaffData';

interface Props {
  selectedManual: ManualItem | null;
  onSelect: (item: ManualItem | null) => void;
}

export const StaffManual = ({ selectedManual, onSelect }: Props) => {
  const router = useRouter();

  // --- 상세 화면 (Manual Detail) ---
  if (selectedManual) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => onSelect(null)} style={{ paddingLeft: 20 }}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.detailMainTitle}>
            {selectedManual.category} - {selectedManual.title}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.summaryText}>
            {selectedManual.category} 시 가장 먼저 해야할 <Text style={styles.highlight}>{selectedManual.steps?.length}단계</Text> 입니다.
          </Text>

          {selectedManual.steps?.map((step) => (
            <View key={step.stepNumber} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Step {step.stepNumber}. {step.title}</Text>
              {step.descriptions.map((desc, idx) => (
                <Text key={idx} style={styles.stepDesc}>- {desc}</Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- 리스트 화면 (Manual List) ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 수정된 최신 헤더 부분 */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={{ width: 90, height: 70 }} 
          resizeMode="contain" 
        />
        <TouchableOpacity onPress={() => router.push('./notification')}>
          <View style={{ position: 'relative' }}>
            <Ionicons name="notifications" size={24} color="#D1C4E9" />
            {/* 최신 badge 스타일 적용 */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>관리 리스트</Text>
        
      {STAFF_MANUAL_LIST.map((item) => (
        // 1. 전체 카드는 View로 변경하여 클릭되지 않게 함
        <View key={item.id} style={styles.card}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          <Text style={styles.cardTitle}>{item.title}</Text>
          
          {/* 2. '자세히보기' 부분만 TouchableOpacity로 감싸서 클릭 이벤트 부여 */}
          <TouchableOpacity 
            style={styles.detailBadge} 
            onPress={() => item.steps && onSelect(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.detailText}>자세히보기</Text>
          </TouchableOpacity>
        </View>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
};