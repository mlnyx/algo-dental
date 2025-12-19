# ALGO - Dental Operating System

Palantir Foundry 스타일의 치과 운영 OS

## 사전 요구사항

- Python 3.10 이상 설치
- Node.js 18.x 이상 설치 ([다운로드](https://nodejs.org/))

## 실행 방법

### 1. 백엔드 실행 (FastAPI)

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```

> **Windows에서 `pip` 명령어가 인식되지 않는 경우** `python -m pip` 사용

백엔드가 http://localhost:8000 에서 실행됩니다.

### 2. 프론트엔드 실행 (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

## 사용 방법

### 📊 대시보드 화면 구성

1. **상단 통계 카드**
   - 총 진료 수: 오늘 처리한 총 진료 건수
   - 진료중 체어: 현재 사용 중인 체어 수 / 전체 5개
   - 평균 대기시간: 환자들의 평균 대기 시간 (분)
   - 장비 가동률: 치과 장비 사용 효율 (%)

2. **체어 상태 모니터 (좌측)**
   - 5개의 체어 카드로 실시간 상태 확인
   - 각 카드 클릭 시:
     - 🟢 **대기중** → 클릭 → **진료중** 상태로 전환 (자동으로 대기열 첫 번째 환자 배정)
     - 🔵 **진료중** → 클릭 → **대기중** 상태로 전환 (진료 종료)
   - 표시 정보: 체어 번호, 환자명, 진료 대기시간

3. **대기열 (우측)**
   - 진료 대기 중인 환자 목록
   - 환자명, 진료 유형, 도착 시간 표시
   - 🔴 긴급 환자는 빨간색 태그로 강조

4. **운영 효율 그래프 (하단)**
   - 왼쪽: 시간대별 진료 건수 (막대 그래프)
   - 오른쪽: 운영 효율 추이 (꺾은선 그래프)
   - 실시간으로 3초마다 자동 업데이트

### 💡 주요 기능

- ✅ **실시간 모니터링**: 3초마다 자동으로 데이터 새로고침
- 🖱️ **원클릭 진료 관리**: 체어 카드 클릭만으로 진료 시작/종료
- 📈 **시각화 차트**: Recharts 기반 인터랙티브 그래프
- 🌙 **Palantir 스타일 UI**: 극도로 정교한 다크 모드 (#0F172A 배경, #38BDF8 포인트)
- 📱 **반응형 레이아웃**: 다양한 화면 크기 지원

## 기술 스택

- **Backend**: FastAPI, Python
- **Frontend**: React, Vite, Tailwind CSS
- **Icons**: lucide-react
- **Charts**: Recharts
