// components/manual/BossManual.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/tabs/boss/Manual';
import { ManualItem } from './BossData';

interface Props {
    manualList: ManualItem[];
    setManualList: React.Dispatch<React.SetStateAction<ManualItem[]>>;
    selectedManual: ManualItem | null;
    onSelect: (item: ManualItem | null) => void;
    onRegister: () => void;
    onEdit: () => void;
}

export const BossManual = ({ 
    manualList, 
    setManualList, 
    selectedManual, 
    onSelect, 
    onRegister, 
    onEdit 
}: Props) => {
    const router = useRouter();

    // 삭제 확인 알림 및 로직
    const handleDelete = (id: string, title: string) => {
        Alert.alert("매뉴얼 삭제", `"${title}" 매뉴얼을 삭제하시겠습니까?`, [
            { text: "취소", style: "cancel" },
            { 
                text: "확인", 
                onPress: () => {
                    const updatedList = manualList.filter(item => item.id !== id);
                    setManualList(updatedList);
                    onSelect(null); // 삭제 후 상세 화면 닫기
                } 
            }
        ]);
    };

    // --- 상세 화면 (selectedManual이 존재할 때) ---
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
                        {selectedManual.category} 시 가장 먼저 해야할 <Text style={styles.highlight}>{selectedManual.steps?.length || 0}단계</Text> 입니다.
                    </Text>
                    
                    {selectedManual.steps?.map((step) => (
                        <View key={step.stepNumber} style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>Step {step.stepNumber}. {step.title}</Text>
                            {step.descriptions.map((desc, idx) => (
                                <Text key={idx} style={styles.stepDesc}>- {desc}</Text>
                            ))}
                        </View>
                    ))}

                    {/* 시안 반영: 상세 보기 하단 수정/삭제 버튼 */}
                    <View style={[styles.bottomBtnRow, { marginTop: 40, gap: 10 }]}>
                        <TouchableOpacity 
                            style={[
                                styles.nextStepBtn, 
                                { flex: 1, borderWidth: 1, borderStyle: 'dashed', borderColor: '#AFAFAF',
                                padding: 15, borderRadius: 15, alignItems: 'center' }
                            ]} 
                            onPress={() => handleDelete(selectedManual.id, selectedManual.title)}
                        >
                            <Text style={{ color: '#FF383C', fontWeight: '700', fontSize: 16 }}>삭제</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[
                                styles.submitBtn, 
                                { flex: 1, backgroundColor: '#E8E5FF99', 
                                padding: 15, borderRadius: 15, alignItems: 'center' }
                            ]} 
                            onPress={onEdit}
                        >
                            <Text style={{ color: '#9747FF', fontWeight: '700', fontSize: 16}}>수정하기</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // --- 리스트 화면 (기본 관리 화면) ---
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <Image 
                    source={require('../../assets/images/logo.png')} 
                    style={{ width: 90, height: 70 }} 
                    resizeMode="contain" 
                />
                <TouchableOpacity onPress={() => router.push('./notification')}>
                    <View style={{ position: 'relative' }}>
                        <Ionicons name="notifications" size={24} color="#D1C4E9" />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>2</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>매뉴얼 관리</Text>
                
                <TouchableOpacity 
                    style={styles.registerBtn} 
                    activeOpacity={0.8}
                    onPress={onRegister}
                >
                    <Text style={styles.registerBtnText}>+ 새 매뉴얼 등록하기</Text>
                </TouchableOpacity>
                
                <Text style={[styles.title, { fontSize: 25 }]}>관리 리스트</Text>
                
                {manualList.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                        
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        
                        <View style={styles.btnGroup}>
                            <TouchableOpacity style={styles.detailBadge} onPress={() => onSelect(item)}>
                                <Text style={styles.detailText}>자세히보기</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.deleteBadge} 
                                onPress={() => handleDelete(item.id, item.title)}
                            >
                                <Text style={styles.deleteText}>삭제</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};