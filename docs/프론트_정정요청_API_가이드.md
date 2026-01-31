# 프론트 정정 요청 API 가이드

정정 요청 API(`/api/v1/modifications`) 호출 시 프론트에서 지켜야 할 사항과 백엔드 스펙 요약입니다.

---

## 1. 인증 (필수)

- **모든** 정정 요청 API 요청에 **Authorization 헤더에 JWT**를 넣어야 합니다.
- **헤더 예시**
  ```http
  Authorization: Bearer {access_token}
  ```
  - `{access_token}`: 로그인 시 받은 **accessToken** (JWT)
  - **백엔드 규칙**: 반드시 `"Bearer "` 로 시작 (**B 대문자**, 뒤에 **공백 한 칸**).  
    - `Bearer eyJ...` (O) / `Bearer eyJ...` (공백 없음) (X) / `bearer ...` (소문자) (X)
- **헤더 이름**: 반드시 `"Authorization"` (대소문자 포함)

---

## 2. 응답 정리

| 상태 | 의미 | 프론트 처리 |
|------|------|-------------|
| **200** | 정상 처리 | 성공 처리 (목록 갱신 등) |
| **401** | 로그인 필요 | JWT 안 보냄 / 만료 / 잘못된 토큰 → 로그인 유도 또는 토큰 갱신 후 재요청 |
| **403** | 권한 없음 | 로그인은 됐지만 해당 API 호출 권한 없음 (예: 승인/거절은 사장님만 가능) |

- **401** 시 백엔드 응답 예: `success: false`, `message: "로그인이 필요합니다."`  
  → 이 메시지를 그대로 사용하고, 로그인 화면 이동 또는 토큰 갱신 후 재요청하도록 처리합니다.
- **403** 시: 승인/거절(PATCH `.../status`)은 **사장님만** 호출 가능 → 알바가 호출하면 403. UI에서 사장님일 때만 승인/거절 버튼 노출 권장.

---

## 3. API 엔드포인트 요약

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/v1/modifications` | 정정 요청 등록 | 로그인 사용자 (알바/사장) |
| GET | `/api/v1/modifications` | 정정 요청 목록 조회 | 로그인 사용자 |
| GET | `/api/v1/modifications/{requestId}` | 정정 요청 상세 조회 | 로그인 사용자 |
| PATCH | `/api/v1/modifications/{requestId}/status` | 승인/거절 | **사장님만** (알바 403) |
| DELETE | `/api/v1/modifications/{requestId}` | 정정 요청 삭제 | 로그인 사용자 (스펙에 따라) |

---

## 4. 요청 body 예시

### POST /api/v1/modifications (정정 요청 등록)

```json
{
  "storeId": 1,
  "targetType": "SCHEDULE",
  "targetId": 42,
  "requestType": "UPDATE",
  "afterValue": "09:00~18:00",
  "targetDate": "2025-02-01",
  "reason": "개인 일정으로 인한 시간 변경 요청"
}
```

- `targetType`: `"SCHEDULE"` | `"ATTENDANCE"`
- `requestType`: `"UPDATE"` (수정 요청) | `"DELETE"` (삭제 요청)
- `afterValue`: `"HH:mm~HH:mm"` 형식 (삭제 시 `"00:00~00:00"` 등)
- `targetDate`: `"YYYY-MM-DD"`

### PATCH /api/v1/modifications/{requestId}/status (승인/거절)

```json
{ "status": "APPROVED" }
```
또는
```json
{ "status": "REJECTED" }
```

- 사장님만 호출 가능. 알바가 호출하면 403.

---

## 5. 프론트에서 작성/주의할 점 요약

| 항목 | 어떻게 작성/처리 |
|------|------------------|
| **헤더** | 모든 정정 요청 API 요청에 `Authorization: Bearer {access_token}` 포함 |
| **토큰** | 로그인 API(`/api/v1/auth/login` 등) 응답의 **accessToken** 사용 |
| **401** | `success: false`, `message: "로그인이 필요합니다."` 이면 로그인 화면 이동 또는 토큰 갱신 후 재요청 |
| **Bearer** | **`Bearer `** (B 대문자, 공백 한 칸) + 토큰. 소문자 `bearer` 또는 공백 없으면 백엔드에서 인식 안 함 |
| **승인/거절** | 사장님만 호출 가능 → UI에서 사장님일 때만 버튼 노출 권장 |

### 알림 시간 표시 (updatedAt 권장)

- **GET /api/v1/modifications** 목록 응답에 각 항목별로 **`createdAt`**(요청 등록 시각), **`updatedAt`**(승인/거절 처리 시각)을 내려주는 것을 권장합니다.
- 프론트에서는 **수락/거절된 건**은 `updatedAt`으로 "N분 전", "방금 전"을 계산합니다.  
  → `updatedAt`이 없으면 `createdAt`만 사용해, 방금 수락한 알림도 "9시간 전"처럼 보일 수 있습니다.

---

## 6. 프론트 구현 요약

- **constants/api.ts**: Axios request interceptor에서 저장된 `accessToken`을 읽어, 모든 요청에 `Authorization: Bearer {token}` (공백 한 칸) 자동 첨부.
- **401 시**: 백엔드 `message` 사용, Alert 등으로 "로그인 필요" 안내 후 **로그인하기** 버튼으로 로그인 화면 이동.
- **403 시**: "승인/거절은 사장님만 가능합니다." 등 권한 안내 메시지 표시.
- **승인/거절 버튼**: 사장 알림 화면에서만 노출 (알바 알림 화면에서는 해당 API 미호출).

---

## 7. 백엔드 JWT 답변 반영 (2025-01-31)

### SecurityConfig·modifications 동작

| 경로 | SecurityConfig | JWT 필터 | modifications 컨트롤러 |
|------|----------------|----------|-------------------------|
| `/api/v1/users/me` | **permitAll()** | 항상 실행. 토큰 있으면 파싱·검증 후 SecurityContext에 넣음. **없어도 통과** | - |
| `/api/v1/schedules/my-weekly` | **permitAll()** | 동일. 토큰 없어도 **접근 허용** | - |
| `/api/v1/modifications/**` | **permitAll()** | 동일 | **userDetails == null 이면 401 + "로그인이 필요합니다."** 직접 반환 |

- **정리**: users/me, my-weekly 는 JWT 없어도 200 가능. **modifications 만** 컨트롤러에서 인증 정보를 보고, 없으면 401을 반환함.
- **백엔드 수정 사항**: JWT 유효 시 principal 을 **CustomUserDetails** 로 설정하도록 변경됨. → **유효한 JWT** 를 보내면 modifications 에서 200 나가야 함.

### modifications 401이 나는 경우 (백엔드 기준)

1. **Authorization 헤더 없음** → 인증 없음 → 401
2. **헤더 형식 오류**: 반드시 **`"Bearer "`** (B 대문자, 뒤 공백 한 칸) 로 시작해야 함.  
   - `Bearer eyJ...` (O) / `Bearer eyJ...` (공백 없음) (X) / `bearer ...` (소문자) (X)
3. **토큰 만료** (ExpiredJwtException) → 401
4. **서명 검증 실패** (secret 불일치, 변조 등) → 401
5. **기타 토큰 오류** (형식, 알고리즘, 클레임 등) → 401

### 401 나올 때 프론트에서 캡처할 것

- **요청 URL** (예: POST /api/v1/modifications)
- **Authorization 헤더 존재 여부** · `Bearer ` 로 시작하는지 · 공백 한 칸인지 (프론트 `[토큰 확인]` 또는 네트워크 탭)
- **응답**: status 401, body `response.data` (예: `{ success: false, message: "로그인이 필요합니다." }`)
- **백엔드 로그**: 해당 요청 시점 서버 콘솔의 `[토큰 확인]`, `[401 디버깅]` 관련 줄

### 프론트에서 확인할 것 (요약)

| 항목 | 내용 |
|------|------|
| **users/me, my-weekly** | JWT 없어도 **접근 허용** (permitAll). 필요하면 JWT 넣어도 됨. |
| **modifications** | **JWT 필수** (없거나 잘못되면 401). `Authorization: Bearer {access_token}` (B 대문자, Bearer 뒤 공백 한 칸). |
| **401 나올 때** | 요청 URL, Authorization 존재 여부, response.data, 백엔드 `[토큰 확인]` / `[401 디버깅]` 로그를 캡처해서 전달하면 원인 파악에 도움. |

---

## 8. modifications 401 원인 확인 결과 (백엔드 확인)

**요약**: Authorization 존재·Bearer 공백은 정상인데 401이 나는 경우, **(2) DB 조회 시 사용하는 값과 JWT subject 불일치**로 인해 401이 발생하는 구조로 확인됨.

| 확인 항목 | 결과 |
|-----------|------|
| (1) JWT 검증(만료·서명) 통과 여부 | 만료/서명 오류 시 `validateToken` false → 인증 미설정 → 401 가능. 통과하면 다음 단계로 진행. |
| **(2) subject ↔ DB 조회 값 일치 여부** | **불일치.** JWT subject = **username**(로그인 아이디), DB 조회 = **findByEmail(subject)** → email 컬럼에 username 값을 넣어 조회. username≠email 이면 조회 실패 → getAuthentication null → 401. |
| (3) principal이 CustomUserDetails로 넘어오는지 | DB 조회 성공 시 CustomUserDetails로 넘어오도록 구현됨. (2) 때문에 조회 실패하면 principal 미설정 → 401. |

**결론**

- JWT subject는 **username**인데 **findByEmail(claims.getSubject())** 를 쓰고 있어서, username과 email이 다르면 항상 401이 나는 구조.
- **백엔드 수정 제안(참고)**: subject가 username이므로 `findByEmail(claims.getSubject())` 대신 **findByUsername(claims.getSubject())** 로 조회하면 값 일치. (실제 수정은 백엔드 반영 여부에 따름.)

이 가이드를 기준으로 프론트 수정 사항과 작성 방법·주의사항을 한 번에 맞출 수 있습니다.
