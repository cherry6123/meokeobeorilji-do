# 먹어버릴지도 — 배포 가이드

## 🚀 3분 배포 (Vercel)

### Step 1: 카카오 API 키 발급
1. https://developers.kakao.com 접속
2. 애플리케이션 추가
3. REST API 키 복사

### Step 2: Vercel 배포
```bash
# 1. 이 폴더에서 터미널 열기
cd deploy

# 2. 의존성 설치
npm install

# 3. 로컬 테스트 (선택)
npm run dev

# 4. Vercel 배포
npx vercel

# 5. 환경변수 설정
# Vercel 대시보드 → Settings → Environment Variables
# KAKAO_REST_API_KEY = 발급받은_키
```

### 또는 GitHub 연동
1. 이 폴더를 GitHub 레포에 push
2. vercel.com에서 Import Project
3. Environment Variables에 KAKAO_REST_API_KEY 추가
4. Deploy 클릭 → 끝

## 📁 프로젝트 구조
```
deploy/
├── api/
│   └── search.js          # Vercel 서버리스 (카카오 API 프록시)
├── public/
│   └── manifest.json      # PWA 설정
├── src/
│   ├── main.jsx           # React 진입점
│   └── App.jsx            # 메인 앱 (먹어버릴지도)
├── .env.example           # 환경변수 템플릿
├── index.html             # HTML
├── package.json           # 의존성
├── vercel.json            # Vercel 설정
└── vite.config.js         # Vite 설정
```

## 🔑 환경변수
| 변수명 | 필수 | 설명 |
|--------|------|------|
| KAKAO_REST_API_KEY | ✅ | 카카오 REST API 키 |

## 📺 구글 애드센스 설정
1. https://adsense.google.com 에서 사이트 등록
2. 퍼블리셔 ID (ca-pub-XXXXXXXXXXXXXXXX) 발급
3. 아래 2곳에서 `ca-pub-XXXXXXXXXXXXXXXX`를 실제 ID로 교체:
   - `index.html` → `<script>` 태그의 client 값
   - `src/App.jsx` → `AdBanner` 컴포넌트의 data-ad-client 값
4. 애드센스 대시보드에서 광고 단위 생성 → 슬롯 ID 발급
5. `App.jsx`의 `AdBanner` slot 값을 실제 슬롯 ID로 교체

### 광고 배치 위치
- **오늘의 PICK 하단** — 홈 메인, 자연스러운 콘텐츠 사이
- **추천 결과 리스트 하단** — 결과 탐색 후 노출

## ⚙️ 작동 방식
1. 앱 로드 → `/api/search` 호출
2. Vercel 서버리스가 카카오 API에 "성수 맛집/카페/베이커리/술집" 검색
3. 결과를 앱 데이터 형식으로 변환하여 반환
4. API 실패 시 → 내장 하드코딩 데이터로 폴백

## 📱 PWA
배포 후 모바일 크롬에서 "홈 화면에 추가" → 앱처럼 사용 가능

## 🗺️ Phase 2 (예정)
- 네이버 지도 SDK 통합
- 사용자 데이터 저장 (Supabase)
- 리뷰/사진 UGC
