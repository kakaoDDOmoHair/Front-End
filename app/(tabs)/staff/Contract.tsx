import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
    ActivityIndicator, Alert, Image, Linking, Modal, Platform,
    SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View
} from 'react-native';

import { StaffContract } from '../../../components/contract/StaffContract';
import { ContractData, STAFF_CONTRACT_DATA } from '../../../components/contract/StaffData';
import { styles } from '../../../styles/tabs/staff/Contract';

export default function StaffContractScreen() {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const myContracts = STAFF_CONTRACT_DATA.filter(c => !c.isResigned);

    const handleOpenOriginal = (item: ContractData) => {
        setSelectedContract(item);
        setModalVisible(true);
    };

    /**
     * ✅ 다운로드 로직: 웹과 모바일 환경을 완벽히 분리하여 에러 방지
     */
    const handleDownloadPdf = async () => {
        if (!selectedContract?.pdfUrl) return Alert.alert('오류', '다운로드 가능한 PDF 경로가 없습니다.');

        // 🌐 웹 환경(Localhost): 브라우저 다운로드/열기 방식으로 처리
        if (Platform.OS === 'web') {
            await Linking.openURL(selectedContract.pdfUrl);
            return;
        }

        // 📱 모바일 환경(Expo Go): 실제 파일 시스템 사용 (오류 아닙니다ㅜㅜ)
        const dir = FileSystem.documentDirectory;
        if (dir) {
            try {
                setIsDownloading(true);
                const fileUri = `${dir}${selectedContract.id}_contract.pdf`;
                const downloadRes = await FileSystem.downloadAsync(selectedContract.pdfUrl, fileUri);
                
                if (downloadRes.status === 200) {
                    await Sharing.shareAsync(downloadRes.uri);
                }
            } catch (error) {
                Alert.alert('다운로드 실패', '모바일 저장소 접근 중 문제가 발생했습니다.');
            } finally {
                setIsDownloading(false);
            }
        } else {
            // 모바일임에도 경로가 없는 특수 상황 대응 (웹은 되는 상황, 앱에서는 처리 안됨)
            Alert.alert('오류', '모바일 파일 시스템을 초기화할 수 없습니다.');
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

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>근로계약서</Text>
                    {myContracts.map(item => (
                        <StaffContract key={item.id} data={item} onViewOriginal={() => handleOpenOriginal(item)} />
                    ))}
                </View>
            </ScrollView>

            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.documentContainer}>
                        <Text style={styles.modalTitle}>계약서 원본</Text>
                        <View style={styles.documentPreview}>
                            <View style={styles.dashedBox}>
                                {selectedContract?.imageUrl ? (
                                    <Image 
                                        source={{ uri: selectedContract.imageUrl }} 
                                        style={{ width: '100%', height: '100%', borderRadius: 25 }} 
                                        resizeMode="contain" 
                                    />
                                ) : (
                                    <Text style={{ color: '#AFAFAF' }}>계약서 이미지가 등록되지 않았습니다.</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeBtnText}>닫기</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.downloadBtn} 
                                onPress={handleDownloadPdf}
                                disabled={isDownloading}
                            >
                                {isDownloading ? <ActivityIndicator /> : <Text style={styles.downloadBtnText}>사본 다운로드</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}