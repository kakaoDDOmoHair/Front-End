import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  notificationCount: number;
}

const Header: React.FC<HeaderProps> = ({ notificationCount }) => {
  const router = useRouter();

  return (
    // styles.header 대신 객체를 직접 넣었습니다.
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingHorizontal: 20, // 가로 여백 추가
        paddingTop: 40, // 상단 여백 추가 (노치 대응)
      }}
    >
      <Image
        source={require("../../assets/images/logo.png")} // 상위 폴더 두 번 (common -> components -> Frontend)
        style={{ width: 90, height: 70 }}
        resizeMode="contain"
      />

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push("/(tabs)/boss/Notification")}
        style={{ position: "relative" }}
      >
        <Ionicons name="notifications" size={24} color="#D1C4E9" />

        {notificationCount > 0 && (
          <View
            style={{
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
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 11,
                fontWeight: "bold",
              }}
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Header;
