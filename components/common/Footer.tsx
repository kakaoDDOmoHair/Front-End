import { usePathname, useRouter } from "expo-router";
// 에러가 발생하는 lucide 대신 안정적인 Ionicons 및 MaterialCommunityIcons 사용
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const BottomTab: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Ionicons와 MaterialCommunityIcons를 섞어서 디자인에 맞게 구성했습니다.
  const tabs = [
    {
      name: "출퇴근관리",
      iconType: "Ionicons",
      iconName: "wifi-outline",
      path: "/boss/Schedule",
    },
    {
      name: "계약서",
      iconType: "Ionicons",
      iconName: "file-tray-full-outline",
      path: "/boss/Contract",
    },
    {
      name: "홈",
      iconType: "Ionicons",
      iconName: "home-outline",
      path: "/boss/Dashboard",
    },
    {
      name: "급여관리",
      iconType: "MaterialCommunityIcons",
      iconName: "wallet-outline",
      path: "/boss/Pay",
    },
    {
      name: "프로필",
      iconType: "Ionicons",
      iconName: "person-outline",
      path: "/boss/Profile",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        position: "absolute",
        bottom: 0,
        width: "100%",
        height: 90,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#F1F1F1",
        paddingBottom: 25,
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.path);
        const iconColor = isActive ? "#A29BFE" : "#333";

        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.8}
            onPress={() => router.push(tab.path as any)}
            style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
          >
            {/* 아이콘 타입에 따라 렌더링 */}
            {tab.iconType === "Ionicons" ? (
              <Ionicons
                name={tab.iconName as any}
                size={24}
                color={iconColor}
              />
            ) : (
              <MaterialCommunityIcons
                name={tab.iconName as any}
                size={24}
                color={iconColor}
              />
            )}

            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                marginTop: 4,
                color: iconColor,
              }}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomTab;
