import React from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// 지운 님이 보여주신 API 명세서의 bankCode 규격에 맞춘 리스트입니다
const BANK_LIST = [
  { name: "신한은행", code: "088" },
  { name: "국민은행", code: "004" },
  { name: "우리은행", code: "020" },
  { name: "하나은행", code: "081" },
  { name: "농협은행", code: "011" },
  { name: "카카오뱅크", code: "090" },
  { name: "토스뱅크", code: "092" },
];

interface BankSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (bank: { name: string; code: string }) => void;
}

export const BankSelectModal = ({
  visible,
  onClose,
  onSelect,
}: BankSelectModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.indicator} />
          <Text style={styles.modalTitle}>은행 선택</Text>
          <ScrollView style={styles.bankList}>
            {BANK_LIST.map((bank) => (
              <TouchableOpacity
                key={bank.code}
                style={styles.bankItem}
                onPress={() => onSelect(bank)}
              >
                <Text style={styles.bankText}>{bank.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "70%",
  },
  indicator: {
    width: 40,
    height: 5,
    backgroundColor: "#EEE",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  bankList: { marginBottom: 20 },
  bankItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  bankText: { fontSize: 16, color: "#333" },
  closeBtn: { padding: 15, alignItems: "center" },
  closeBtnText: { color: "#999", fontSize: 16 },
});
