import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ManualItem, Step } from '../../../components/manual/BossData';
import { STEP_PLACEHOLDERS } from '../../../components/manual/ManualPlaceholders'; // 데이터 임포트
import { styles } from '../../../styles/tabs/boss/Manual';

interface Props {
  mode?: 'register' | 'edit';
  initialData?: ManualItem | null;
  onClose: () => void;
  onSave: (newItem: ManualItem) => void;
}

export const BossManualForm = ({ mode = 'register', initialData, onClose, onSave }: Props) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || '오픈');
  const [steps, setSteps] = useState<Step[]>(
    initialData?.steps || [{ stepNumber: 1, title: '', descriptions: [''] }]
  );

  const addStep = () => {
    setSteps([...steps, { stepNumber: steps.length + 1, title: '', descriptions: [''] }]);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("알림", "업무 명칭을 입력해주세요.");
      return;
    }

    const manualData: ManualItem = {
      id: mode === 'edit' && initialData ? initialData.id : Date.now().toString(),
      category,
      title,
      steps,
    };

    onSave(manualData);
    Alert.alert("성공", mode === 'register' ? "매뉴얼이 등록되었습니다." : "매뉴얼이 수정되었습니다.");
    onClose();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onClose} style={{ paddingLeft: 20 }}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.detailMainTitle}>
            {mode === 'register' ? '새 매뉴얼 등록' : '매뉴얼 수정'}
          </Text>
        </View>

        <ScrollView 
          contentContainerStyle={[styles.content, { paddingBottom: 40 }]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.inputLabel}>제목</Text>
          <TextInput 
            style={styles.dashedInput} 
            placeholder="업무 명칭을 입력해주세요."
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.inputLabel}>카테고리</Text>
          <View style={styles.categoryContainer}>
            {['오픈', '마감', '결제', '기타'].map((item) => (
              <TouchableOpacity 
                key={item} 
                style={[styles.categoryChip, category === item && styles.categoryChipSelected]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.categoryChipText, category === item && styles.categoryChipTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>상세 설명</Text>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepInputBox}>
              <Text style={styles.stepLabel}>Step {step.stepNumber}</Text>
              
              {/* 단계별 제목 입력창 */}
              <TextInput 
                // STEP_PLACEHOLDERS 배열에서 해당 index의 title을 가져옵니다.
                placeholder={STEP_PLACEHOLDERS[index]?.title || `Step ${step.stepNumber} 제목을 입력하세요`}
                style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}
                value={step.title}
                onChangeText={(text) => {
                  const newSteps = [...steps];
                  newSteps[index].title = text;
                  setSteps(newSteps);
                }}
              />

              {/* 단계별 세부 설명 입력창 */}
              <TextInput 
                // STEP_PLACEHOLDERS 배열에서 해당 index의 desc를 가져옵니다.
                placeholder={STEP_PLACEHOLDERS[index]?.desc || "세부 업무 내용을 입력해주세요"}
                style={{ fontSize: 15, color: '#AFAFAF', paddingTop: 10 }}
                multiline
                value={step.descriptions[0]}
                onChangeText={(text) => {
                  const newSteps = [...steps];
                  newSteps[index].descriptions = [text];
                  setSteps(newSteps);
                }}
              />
            </View>
          ))}

          <View style={styles.bottomBtnRow}>
            <TouchableOpacity style={styles.nextStepBtn} onPress={addStep}>
              <Text style={styles.nextStepBtnText}>다음 단계 추가하기</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>
                {mode === 'register' ? '매뉴얼 등록하기' : '수정 완료'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};