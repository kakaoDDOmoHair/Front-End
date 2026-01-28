import React from "react";
import {
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export const AddressSearchModal = ({ visible, onClose, onSelect }: any) => {
  if (Platform.OS === "web") return null;

  const kakaoAddressHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
        <style>
          html, body { width:100%; height:100%; margin:0; padding:0; background-color: white; }
          #layer { width:100%; height:100%; }
        </style>
      </head>
      <body>
        <div id="layer"></div>
        <script type="text/javascript">
          var element_layer = document.getElementById('layer');
          
          new daum.Postcode({
            oncomplete: function(data) {
              var fullAddr = data.roadAddress || data.address;
              
              // 💡 에뮬레이터 통신 보장 로직
              var sendData = function() {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(fullAddr);
                } else {
                  // 객체가 보일 때까지 0.1초마다 재시도
                  setTimeout(sendData, 100);
                }
              };
              sendData();
            },
            width : '100%',
            height : '100%'
          }).embed(element_layer);
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    // 💡 에뮬레이터 Metro 터미널 창을 꼭 보세요!
    console.log("🚀 [성공] 주소 데이터 수신:", event.nativeEvent.data);

    const addr = event.nativeEvent.data;
    if (addr && typeof addr === "string" && !addr.includes("webpack")) {
      onSelect(addr);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>주소 검색</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Text style={modalStyles.closeBtn}>닫기</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ html: kakaoAddressHtml }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={["*"]}
          // 💡 iOS 에뮬레이터 필수 설정
          incognito={true} // 캐시 문제 방지
          useWebKit={true}
          onLoadEnd={() => console.log("✅ WebView 로딩 완료 (에뮬레이터)")}
        />
      </SafeAreaView>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 17, fontWeight: "bold" },
  closeBtn: { color: "#6C5CE7", fontWeight: "bold", padding: 5 },
});
