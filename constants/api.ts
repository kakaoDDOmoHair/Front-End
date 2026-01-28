// api BASE_URL 등록
import axios from "axios";

// 💡 ngrok에서 받은 새로운 주소를 여기에 넣으세요
const BASE_URL = "https://queenliest-profamily-jarrett.ngrok-free.dev";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    // 💡 ngrok 접속 시 나타나는 초기 경고 페이지를 건너뛰기 위한 헤더입니다.
    "ngrok-skip-browser-warning": "69420",
  },
});

export default api;
