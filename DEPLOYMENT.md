# 🚀 ALGO 배포 가이드

## 1단계: GitHub에 코드 업로드

```bash
cd C:\Users\user\Desktop\algo2
git init
git add .
git commit -m "Initial commit - ALGO Dental OS"
git branch -M main
git remote add origin https://github.com/[your-username]/algo-dental.git
git push -u origin main
```

## 2단계: 백엔드 배포 (Render.com)

### 2-1. Render 가입 및 설정
1. [render.com](https://render.com) 접속 → GitHub로 가입
2. "New +" → "Web Service" 클릭
3. GitHub 저장소 연결
4. 다음 설정 입력:
   - **Name**: `algo-backend`
   - **Region**: Singapore (가장 가까움)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. "Create Web Service" 클릭
6. 배포 완료 후 URL 복사 (예: `https://algo-backend.onrender.com`)

### 2-2. 백엔드 URL 확인
배포 완료 후 제공되는 URL을 복사하세요.

## 3단계: 프론트엔드 배포 (Vercel)

### 3-1. 환경 변수 설정
1. `frontend/.env.production` 파일에서 백엔드 URL 수정:
```
VITE_API_URL=https://algo-backend.onrender.com
```

### 3-2. Vercel 배포
1. [vercel.com](https://vercel.com) 접속 → GitHub로 가입
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택
4. 다음 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Environment Variables 추가:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://algo-backend.onrender.com` (2단계에서 복사한 URL)
6. "Deploy" 클릭
7. 배포 완료! (예: `https://algo-dental.vercel.app`)

## 4단계: 백엔드 CORS 설정 업데이트

백엔드 `main.py`의 CORS 설정을 Vercel URL로 업데이트:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://algo-dental.vercel.app",  # 실제 Vercel URL로 변경
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

변경 후 GitHub에 푸시하면 자동으로 재배포됩니다.

## 5단계: 완료!

이제 전 세계 어디서든 접속 가능합니다:
- **프론트엔드**: https://algo-dental.vercel.app
- **백엔드 API**: https://algo-backend.onrender.com

---

## 📌 주의사항

### Render.com (무료 플랜)
- 15분 동안 요청이 없으면 서버가 sleep 상태로 전환
- 첫 요청 시 30초~1분 정도 대기 시간 발생
- 월 750시간 무료 (충분함)

### Vercel (무료 플랜)
- 무제한 배포
- 자동 HTTPS
- 빠른 CDN

### 데이터베이스
- 현재는 SQLite 파일 사용 (서버 재시작 시 초기화됨)
- 실제 서비스 시 PostgreSQL 등으로 변경 권장

---

## 🔄 업데이트 방법

코드 수정 후:
```bash
git add .
git commit -m "Update features"
git push
```

자동으로 재배포됩니다!

---

## 🆘 문제 해결

### 백엔드 연결 안 됨
1. Render 대시보드에서 로그 확인
2. CORS 설정 확인
3. 환경 변수 확인

### 프론트엔드 빌드 실패
1. Vercel 대시보드에서 로그 확인
2. `VITE_API_URL` 환경 변수 확인
3. 로컬에서 `npm run build` 테스트
