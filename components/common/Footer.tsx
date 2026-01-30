import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Footer: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  // ✅ 현재 경로가 /staff 인지 /boss 인지 자동으로 판단합니다.
  // pathname이 "/(tabs)/staff/Dashboard" 식이라면 "staff"를 추출합니다.
  const userType = pathname.includes("/staff") ? "staff" : "boss";

  // ✅ 경로를 userType에 따라 동적으로 생성합니다.
  const tabs = [
    {
      name: "출퇴근관리",
      iconType: "Ionicons",
      iconName: "wifi",
      path: `/(tabs)/${userType}/Schedule`,
    },
    {
      name: "계약서",
      iconType: "Ionicons",
      iconName: "document-text",
      path: `/(tabs)/${userType}/Contract`,
    },
    {
      name: "홈",
      iconType: "Ionicons",
      iconName: "home",
      path: `/(tabs)/${userType}/Dashboard`,
    },
    {
      name: "급여관리",
      iconType: "MaterialCommunityIcons",
      iconName: "wallet",
      path: `/(tabs)/${userType}/Pay`,
    },
    {
      name: "프로필",
      iconType: "Ionicons",
      iconName: "person",
      path: `/(tabs)/${userType}/Profile`,
    },
  ];

  return (
    <View style={styles.footerContainer}>
      {tabs.map((tab) => {
        // 활성화 표시를 위한 경로 비교
        const cleanPathname = pathname.replace("/(tabs)", "");
        const cleanTabPath = tab.path.replace("/(tabs)", "");

        const isActive =
          cleanPathname === cleanTabPath ||
          cleanPathname.includes(cleanTabPath);

        const iconColor = isActive ? "#9747FF" : "#333";

        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.8}
            onPress={() => {
              if (!isActive) {
                router.replace(tab.path as any);
              }
            }}
            style={styles.tabItem}
          >
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
              style={[
                styles.tabLabel,
                { color: iconColor, fontWeight: isActive ? "700" : "500" },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// 스타일 부분은 기존과 동일하므로 생략합니다.
const styles = StyleSheet.create({
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    paddingBottom: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  },
});

export default Footer;
