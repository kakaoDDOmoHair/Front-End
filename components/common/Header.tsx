import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useUnreadNotification } from "@/contexts/UnreadNotificationContext";
import { useNotificationCount } from "@/hooks/useNotificationCount";

interface HeaderProps {
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = (props) => {
  const router = useRouter();
  const pathname = usePathname();
  const userType = pathname.includes("/staff") ? "staff" : "boss";
  const apiCount = useNotificationCount(userType);
  const contextUnread = useUnreadNotification(userType);
  const notificationCount = contextUnread !== null ? contextUnread : (props.notificationCount ?? apiCount);

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
        onPress={() => {
          const current = pathname || "";
          const isNotification = current.includes("/Notification");
          const returnTo = !isNotification && current ? encodeURIComponent(current) : "";
          const href = returnTo
            ? `/(tabs)/${userType}/Notification?returnTo=${returnTo}` as any
            : `/(tabs)/${userType}/Notification` as any;
          router.push(href);
        }}
        style={styles.bellWrap}
      >
        <Ionicons name="notifications" size={24} color="#E0D5FF" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {notificationCount > 99 ? "99+" : Number(notificationCount) || 0}
          </Text>
        </View>
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
  bellWrap: {
    position: "relative",
    overflow: "visible",
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
    zIndex: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});

export default Header;
