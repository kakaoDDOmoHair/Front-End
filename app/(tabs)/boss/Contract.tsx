import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 데이터 모델 및 초기 데이터
import { ContractData, CONTRACT_DATA as INITIAL_DATA } from '../../../components/contract/BossData';
import { styles } from '../../../styles/tabs/boss/Contract';

/**
 * 1. 개별 계약서 카드 컴포넌트
 */
const BossContract: React.FC<{ 
  data: ContractData; 
  onDelete: (id: string) => void;
  onView: (data: ContractData) => void;
}> = ({ data, onDelete, onView }) => {
  const handleDelete = () => {
    Alert.alert('계약 삭제', `${data.name}님의 데이터를 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { 
        text: '삭제', 
        style: 'destructive', 
        onPress: () => {
          onDelete(data.id);
          Alert.alert('알림', '삭제되었습니다.');
        } 
      }
    ]);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{data.name} ({data.location})</Text>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: data.status === '계약 중' ? '#CB30E0' : '#D3D3D3' }]} />
        <Text style={styles.statusText}>{data.status} | {data.wage.toLocaleString()}원</Text>
      </View>
      <View style={{ height: 10 }} />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onView(data)}>
          <Text style={styles.actionButtonText}>계약서 열람</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Text style={styles.actionButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * 2. 메인 ContractScreen 컴포넌트
 */
export default function ContractScreen() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractData[]>(INITIAL_DATA);
  
  // 업로드 모달 상태
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  // 열람 모달 상태
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 데이터 필터링
  const activeContracts = contracts.filter(c => !c.isResigned);
  const resignedContracts = contracts.filter(c => c.isResigned);

  // --- 이미지 업로드/촬영 로직 ---
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setRotation(0);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setRotation(0);
    }
  };

  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleUpload = async () => {
    if (!selectedImage) return Alert.alert('알림', '계약서를 먼저 선택해주세요.');
    try {
      setIsAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      const newContract: ContractData = {
        id: String(Date.now()), 
        name: "매칭완료_알바생", 
        location: "제주공항점", 
        status: '계약 중', 
        wage: 11000, 
        isResigned: false,
        imageUrl: selectedImage,
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      };
      setContracts(prev => [newContract, ...prev]);
      Alert.alert('성공', '계약 정보가 정상 등록되었습니다.');
      setIsScanning(false);
      setSelectedImage(null);
    } catch (error) {
      Alert.alert('오류', '데이터 검증 중 문제가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * ✅ 수정된 사본 다운로드 및 공유 로직
   */
  const handleDownloadPdf = async () => {
    if (!selectedContract?.pdfUrl) {
      return Alert.alert('오류', '다운로드 가능한 PDF 경로가 없습니다.');
    }

    // 🌐 웹 환경 (Localhost 등)
    if (Platform.OS === 'web') {
      await Linking.openURL(selectedContract.pdfUrl);
      return;
    }

    // 📱 모바일 환경 (Expo Go / 빌드 앱)
    try {
      setIsDownloading(true);

      const dir = FileSystem.documentDirectory;
      if (!dir) throw new Error('파일 시스템 경로를 찾을 수 없습니다.');

      // 저장될 파일 이름 설정 (이름_근로계약서_ID.pdf)
      const fileName = `${selectedContract.name}_근로계약서_${selectedContract.id}.pdf`;
      const fileUri = `${dir}${fileName}`;

      // 1. 파일 시스템으로 다운로드
      const downloadRes = await FileSystem.downloadAsync(
        selectedContract.pdfUrl,
        fileUri
      );

      // 2. 다운로드 성공 시 공유/저장 창 호출
      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `${selectedContract.name}님의 계약서 사본`,
            UTI: 'com.adobe.pdf', // iOS 전용 확장자 힌트
          });
        } else {
          Alert.alert('알림', '이 기기에서는 파일 공유 기능을 사용할 수 없습니다.');
        }
      } else {
        throw new Error('서버에서 파일을 받아오지 못했습니다.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '사본을 내려받는 중 문제가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Image source={require('../../../assets/images/logo.png')} style={{ width: 90, height: 70 }} resizeMode="contain" />
        <TouchableOpacity onPress={() => router.push('./notification')}>
          <Ionicons name="notifications" size={24} color="#D1C4E9" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>신규 계약 준비</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={() => setIsScanning(true)}>
            <Text style={styles.uploadButtonText}>계약서 사진 업로드</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관리 리스트 (계약 중)</Text>
          {activeContracts.length > 0 ? (
            activeContracts.map(item => (
              <BossContract 
                key={item.id} 
                data={item} 
                onDelete={(id) => setContracts(prev => prev.filter(c => c.id !== id))} 
                onView={(data) => { setSelectedContract(data); setViewModalVisible(true); }} 
              />
            ))
          ) : (
            <Text style={styles.emptyText}>현재 관리 중인 직원이 없습니다.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>퇴사자 내역</Text>
          {resignedContracts.length > 0 ? (
            resignedContracts.map(item => (
              <BossContract 
                key={item.id} 
                data={item} 
                onDelete={(id) => setContracts(prev => prev.filter(c => c.id !== id))} 
                onView={(data) => { setSelectedContract(data); setViewModalVisible(true); }} 
              />
            ))
          ) : (
            <Text style={styles.emptyText}>보관 중인 퇴사자 데이터가 없습니다.</Text>
          )}
        </View>
      </ScrollView>

      {/* 모달 1: 계약서 사진 등록 */}
      <Modal visible={isScanning} transparent={true} animationType="fade">
        <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
          <View style={styles.scannerContainer}>
            <Text style={styles.scannerTitle}>계약서 등록</Text>
            <View style={styles.guideContainer}>
              {isAnalyzing ? (
                <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#9747FF" />
                  <Text style={{ marginTop: 15, color: '#9747FF', fontWeight: 'bold' }}>이미지를 확인 중입니다...</Text>
                </View>
              ) : (
                <View style={styles.dashedBox}>
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} style={{ width: '100%', height: '100%', borderRadius: 25, transform: [{ rotate: `${rotation}deg` }] }} resizeMode="contain" />
                  ) : (
                    <Text style={styles.guideText}>계약서 전체가 잘 보이도록 촬영해주세요</Text>
                  )}
                </View>
              )}
              <View style={styles.scanControlRow}>
                <TouchableOpacity style={styles.scanControlBtn} onPress={pickImage} disabled={isAnalyzing}>
                  <Text style={styles.controlIcon}>🖼️ 갤러리</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scanControlBtn} onPress={takePhoto} disabled={isAnalyzing}>
                  <Text style={styles.controlIcon}>📷 촬영</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scanControlBtn} onPress={handleRotate} disabled={isAnalyzing || !selectedImage}>
                  <Text style={styles.controlIcon}>🔄 회전</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setIsScanning(false); setSelectedImage(null); }} disabled={isAnalyzing}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleUpload} disabled={isAnalyzing || !selectedImage}>
                <Text style={styles.modalSubmitText}>{isAnalyzing ? '확인 중...' : '등록하기'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 모달 2: 계약서 열람 및 다운로드 */}
      <Modal visible={viewModalVisible} transparent={true} animationType="slide">
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
          <View style={styles.documentContainer}>
            <Text style={styles.modalTitle}>계약서 원본</Text>
            <View style={styles.documentPreview}>
              <View style={styles.viewDashedBox}>
                {selectedContract?.imageUrl ? (
                  <Image source={{ uri: selectedContract.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 25 }} resizeMode="contain" />
                ) : (
                  <Text style={{ color: '#AFAFAF' }}>이미지가 없습니다.</Text>
                )}
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setViewModalVisible(false)}>
                <Text style={styles.closeBtnText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.downloadBtn} 
                onPress={handleDownloadPdf} 
                disabled={isDownloading}
              >
                {isDownloading ? <ActivityIndicator color="#9747FF" /> : <Text style={styles.downloadBtnText}>사본 다운로드</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}  