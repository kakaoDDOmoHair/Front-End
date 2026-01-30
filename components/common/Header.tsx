import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router"; // ✅ usePathname 추가
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  notificationCount: number;
}

const Header: React.FC<HeaderProps> = ({ notificationCount }) => {
  const router = useRouter();
  const pathname = usePathname(); // ✅ 현재 경로를 가져옵니다.

  // ✅ 현재 경로가 staff인지 boss인지 판단 (경로에 포함된 키워드로 확인)
  const userType = pathname.includes("/staff") ? "staff" : "boss";

  return (
    <View style={styles.header}>
      {/* 로고 영역: 클릭 시 각자의 대시보드로 이동하도록 설정 가능 */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/(tabs)/${userType}/Dashboard` as any)}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 90, height: 70 }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        // ✅ 하드코딩된 'boss' 대신 'userType' 변수를 사용합니다.
        onPress={() => router.push(`/(tabs)/${userType}/Notification` as any)}
        style={{ position: "relative" }}
      >
        <Ionicons name="notifications" size={24} color="#E0D5FF" />

        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount > 99 ? "99+" : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});

export default Header;
