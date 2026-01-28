import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

// ✅ 분리된 데이터, 컴포넌트, 스타일 임포트
import { BOSS_DATA } from '@/components/profile/BossData';
import { STAFF_DATA } from '../../../components/profile/StaffData';
import StaffProfile from '../../../components/profile/StaffProfile';
import { modalStyles, styles } from '../../../styles/tabs/staff/Profile';

export default function StaffProfileScreen() {
    const router = useRouter();

    // --- 모달 상태 관리 ---
    const [isChangeModalVisible, setChangeModalVisible] = useState(false);
    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
    const [isWithdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [isWithdrawSuccessVisible, setWithdrawSuccessVisible] = useState(false);

    // --- 입력값 및 에러 상태 ---
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
    const [withdrawPassword, setWithdrawPassword] = useState('');
    const [currentPwError, setCurrentPwError] = useState('');
    const [withdrawPwError, setWithdrawPwError] = useState('');

    // --- 가시성 및 동의 상태 ---
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showWithdrawPw, setShowWithdrawPw] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);

    // ✅ 초기화 함수
    const resetChangeInputs = () => {
        setPasswords({ current: '', next: '', confirm: '' });
        setCurrentPwError('');
        setShowCurrent(false); setShowNext(false); setShowConfirm(false);
    };

    const resetWithdrawInputs = () => {
        setWithdrawPassword('');
        setWithdrawPwError('');
        setShowWithdrawPw(false);
        setIsAgreed(false);
    };

    // ✅ 검증 로직
    const validatePassword = (pw: string) => {
        const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(pw);
    };

    const isNextValid = validatePassword(passwords.next);
    const isMatch = passwords.next === passwords.confirm && passwords.confirm.length > 0;
    const canSave = passwords.current.length > 0 && isNextValid && isMatch;

    // ✅ 핸들러 함수
    const handleSavePassword = () => {
        if (!canSave) return;
        const MOCK_DB_PASSWORD = "password123!"; 
        if (passwords.current !== MOCK_DB_PASSWORD) {
            setCurrentPwError('현재 비밀번호가 일치하지 않습니다.');
            return;
        }
        setChangeModalVisible(false);
        setSuccessModalVisible(true);
        resetChangeInputs();
    };

    const handleWithdrawal = () => {
        const MOCK_DB_PASSWORD = "password123!";
        if (withdrawPassword !== MOCK_DB_PASSWORD) {
            setWithdrawPwError('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (withdrawPassword && isAgreed) {
            setWithdrawModalVisible(false);
            setWithdrawSuccessVisible(true);
            resetWithdrawInputs();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* 상단 헤더 */}
            <View style={styles.header}>
                <Image source={require('../../../assets/images/logo.png')} style={{ width: 90, height: 70 }} resizeMode="contain" />
                <TouchableOpacity onPress={() => router.push('./notification')}>
                    <View style={{ position: 'relative' }}>
                        <Ionicons name="notifications" size={24} color="#D1C4E9" />
                        <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
                {/* 알바생 프로필 요약 (STAFF_DATA 사용) */}
                <StaffProfile data={STAFF_DATA} />

                {/* 계정 정보 섹션 */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>계정 정보</Text>
                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => setChangeModalVisible(true)}>
                            <Text style={styles.menuText}>비밀번호 변경</Text>
                            <Ionicons name="chevron-forward" size={18} color="#AFAFAF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => setWithdrawModalVisible(true)}>
                            <Text style={styles.menuText}>회원 탈퇴</Text>
                            <Ionicons name="chevron-forward" size={18} color="#AFAFAF" />
                        </TouchableOpacity>
                </View>

                {/* 근무 정보 섹션 */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>근무 정보</Text>
                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => router.push('/staff/Contract')}>
                            <Text style={styles.menuText}>근로계약서</Text>
                            <Ionicons name="chevron-forward" size={18} color="#AFAFAF" />
                        </TouchableOpacity>
                </View>
            </ScrollView>

            {/* --- 모달 모음 --- */}

            {/* 1. 비밀번호 변경 모달 */}
            <Modal visible={isChangeModalVisible} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={modalStyles.overlay}>
                        <View style={modalStyles.modalContainer}>
                            <Text style={modalStyles.modalTitle}>비밀번호 변경</Text>
                            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                                <View style={modalStyles.inputGroup}>
                                    <Text style={modalStyles.label}>현재 비밀번호</Text>
                                    <View style={[modalStyles.passwordInputWrapper, currentPwError !== '' && modalStyles.inputError]}>
                                        <TextInput 
                                            style={modalStyles.inputWithIcon} placeholder="현재 비밀번호를 입력해 주세요" secureTextEntry={!showCurrent}
                                            value={passwords.current} onChangeText={(text) => { setPasswords({...passwords, current: text}); if (currentPwError) setCurrentPwError(''); }} 
                                        />
                                        {passwords.current.length > 0 && (
                                            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={modalStyles.eyeIcon}>
                                                <Ionicons name={showCurrent ? "eye-outline" : "eye-off-outline"} size={18} color="#AFAFAF" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {currentPwError !== '' && <Text style={modalStyles.errorText}>{currentPwError}</Text>}
                                </View>

                                <View style={modalStyles.inputGroup}>
                                <Text style={modalStyles.label}>새 비밀번호</Text>
                                <View style={[modalStyles.passwordInputWrapper, passwords.next.length > 0 && !isNextValid && modalStyles.inputError]}>
                                    <TextInput 
                                    style={modalStyles.inputWithIcon} placeholder="영문, 숫자 포함 8자 이상 입력해 주세요." placeholderTextColor="#AFAFAF" 
                                    secureTextEntry={!showNext} value={passwords.next} onChangeText={(text) => setPasswords({...passwords, next: text})} 
                                    />
                                    {/* ✅ 글자가 있을 때만 눈 아이콘 표시 */}
                                    {passwords.next.length > 0 && (
                                    <TouchableOpacity onPress={() => setShowNext(!showNext)} style={modalStyles.eyeIcon}>
                                        <Ionicons name={showNext ? "eye-outline" : "eye-off-outline"} size={18} color="#AFAFAF" />
                                    </TouchableOpacity>
                                    )}
                                </View>
                                {passwords.next.length > 0 && !isNextValid && <Text style={modalStyles.errorText}>영문/숫자/특수문자 포함 8자 이상이어야 합니다.</Text>}
                                </View>

                                <View style={modalStyles.inputGroup}>
                                <Text style={modalStyles.label}>새 비밀번호 확인</Text>
                                <View style={[modalStyles.passwordInputWrapper, passwords.confirm.length > 0 && !isMatch && modalStyles.inputError]}>
                                    <TextInput 
                                    style={modalStyles.inputWithIcon} placeholder="한 번 더 입력해 주세요." placeholderTextColor="#AFAFAF" 
                                    secureTextEntry={!showConfirm} value={passwords.confirm} onChangeText={(text) => setPasswords({...passwords, confirm: text})} 
                                    />
                                    {/* ✅ 글자가 있을 때만 눈 아이콘 표시 */}
                                    {passwords.confirm.length > 0 && (
                                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={modalStyles.eyeIcon}>
                                        <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={18} color="#AFAFAF" />
                                    </TouchableOpacity>
                                    )}
                                </View>
                                {passwords.confirm.length > 0 && !isMatch && <Text style={modalStyles.errorText}>비밀번호가 일치하지 않습니다.</Text>}
                                </View>
                            </ScrollView>

                            <View style={modalStyles.buttonRow}>
                                <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => { setChangeModalVisible(false); resetChangeInputs(); }}>
                                <Text style={modalStyles.cancelBtnText}>취소</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[modalStyles.saveBtn, !canSave && modalStyles.saveBtnDisabled]} onPress={handleSavePassword} disabled={!canSave}>
                                <Text style={[modalStyles.saveBtnText, { color: canSave ? '#9747FF' : '#AFAFAF' }]}>저장</Text>
                                </TouchableOpacity>
                            </View>
                            </View>
                        </KeyboardAvoidingView>
                        </TouchableWithoutFeedback>
                    </Modal>
                    
            {/* 2. 비밀번호 변경 완료 모달 */}
            <Modal visible={isSuccessModalVisible} transparent animationType="fade">
                <View style={modalStyles.overlay}>
                    <View style={[modalStyles.modalContainer, { alignItems: 'center', paddingVertical: 40 }]}>
                        <View style={modalStyles.doorCircle}><Ionicons name="checkmark-circle-outline" size={65} color="#9747FF" /></View>
                        <Text style={modalStyles.successTitle}>변경 완료</Text>
                        <Text style={modalStyles.successDesc}>비밀번호가 안전하게 변경되었습니다.</Text>
                        <TouchableOpacity style={modalStyles.confirmBtn} onPress={() => setSuccessModalVisible(false)}>
                            <Text style={modalStyles.confirmBtnText}>확인</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* 3. 회원 탈퇴 모달 */}
            <Modal visible={isWithdrawModalVisible} transparent animationType="slide">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={modalStyles.overlay}>
                        <View style={modalStyles.modalContainer}>
                            <Text style={modalStyles.modalTitle}>회원 탈퇴</Text>
                            <View style={modalStyles.withdrawWarningBox}>
                                <Text style={modalStyles.withdrawWarningText}>정말로 PayMate를 떠나시겠어요?</Text>
                                <Text style={modalStyles.withdrawWarningText}>작성된 전자 근로계약서 열람이 <Text style={{color: '#FF383C', fontWeight: 'bold'}}>불가능</Text>하니 탈퇴 전 미리 저장하세요.</Text>
                            </View>

            <View style={modalStyles.inputGroup}>
                <Text style={modalStyles.label}>현재 비밀번호 확인</Text>
                <View style={[modalStyles.passwordInputWrapper, withdrawPwError !== '' && modalStyles.inputError]}>
                  <TextInput 
                    style={modalStyles.inputWithIcon} 
                    placeholder="비밀번호를 입력해 주세요." placeholderTextColor="#AFAFAF"
                    secureTextEntry={!showWithdrawPw} 
                    value={withdrawPassword} 
                    onChangeText={(text) => {
                        setWithdrawPassword(text);
                        if (withdrawPwError) setWithdrawPwError('');
                    }} 
                  />
                  {/* ✅ 글자가 있을 때만 눈 아이콘 표시 */}
                  {withdrawPassword.length > 0 && (
                    <TouchableOpacity onPress={() => setShowWithdrawPw(!showWithdrawPw)} style={modalStyles.eyeIcon}>
                      <Ionicons name={showWithdrawPw ? "eye-outline" : "eye-off-outline"} size={18} color="#AFAFAF" />
                    </TouchableOpacity>
                  )}
                </View>
                {withdrawPwError !== '' && <Text style={modalStyles.errorText}>{withdrawPwError}</Text>}
              </View>

              <TouchableOpacity style={modalStyles.checkboxRow} onPress={() => setIsAgreed(!isAgreed)}>
                <Ionicons name={isAgreed ? "checkbox" : "square-outline"} size={22} color={isAgreed ? "#E0D5FF" : "#AFAFAF"} />
                <Text style={modalStyles.checkboxLabel}>안내 사항을 숙지하였으며, 탈퇴에 동의합니다.</Text>
              </TouchableOpacity>

              <View style={modalStyles.buttonRow}>
                <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => { setWithdrawModalVisible(false); resetWithdrawInputs(); }}>
                  <Text style={modalStyles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[modalStyles.saveBtn, !(withdrawPassword && isAgreed) && modalStyles.saveBtnDisabled]} onPress={handleWithdrawal} disabled={!(withdrawPassword && isAgreed)}>
                  <Text style={[modalStyles.saveBtnText, { color: (withdrawPassword && isAgreed) ? '#9747FF' : '#AFAFAF' }]}>탈퇴하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 완료 모달들 (Success Modals) - 기존 정렬 유지 */}
      <Modal visible={isWithdrawSuccessVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.modalContainer, { alignItems: 'center', paddingVertical: 40 }]}>
            <View style={modalStyles.doorCircle}><Ionicons name="exit-outline" size={65} color="#E0D5FF" /></View>
            <Text style={modalStyles.successTitle}>탈퇴 완료</Text>
            <Text style={modalStyles.successDesc}>{BOSS_DATA.name}님, 이용해 주셔서 감사합니다.</Text>
            <TouchableOpacity 
              style={modalStyles.confirmBtn} 
              onPress={() => { setWithdrawSuccessVisible(false); router.replace('/login'); }} 
            >
              <Text style={modalStyles.confirmBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
