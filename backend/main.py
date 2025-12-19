from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from database import engine, get_db

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ALGO - 치과 운영 OS")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic 모델
class ChairUpdate(BaseModel):
    status: str
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None

class ChairResponse(BaseModel):
    id: int
    status: str
    patient: Optional[str]
    patientPhone: Optional[str]
    waitTime: int
    lastUpdate: Optional[str]

class PatientCreate(BaseModel):
    name: str
    phone: str
    treatment_type: str
    priority: str = "normal"

class PatientResponse(BaseModel):
    id: int
    name: str
    phone: str
    type: str
    priority: str
    arrivalTime: str


# 초기 데이터 설정
@app.on_event("startup")
def startup_event():
    db = next(get_db())
    
    # 체어가 없으면 5개 생성
    if db.query(models.Chair).count() == 0:
        for i in range(1, 6):
            chair = models.Chair(id=i, status="idle")
            db.add(chair)
        db.commit()
    
    # 샘플 대기 환자가 없으면 추가
    if db.query(models.Patient).filter(models.Patient.is_waiting == True).count() == 0:
        sample_patients = [
            models.Patient(name="김민수", phone="010-1234-5678", treatment_type="정기검진", priority="normal"),
            models.Patient(name="이지은", phone="010-2345-6789", treatment_type="스케일링", priority="normal"),
            models.Patient(name="박철수", phone="010-3456-7890", treatment_type="긴급치료", priority="high"),
        ]
        for patient in sample_patients:
            db.add(patient)
        db.commit()
    db.close()

# API 엔드포인트
@app.get("/")
def read_root():
    return {"message": "ALGO - Dental Operating System API v2.0"}


@app.get("/api/chairs", response_model=List[ChairResponse])
def get_chairs(db: Session = Depends(get_db)):
    """치과 체어 5개의 현재 상태 반환"""
    chairs = db.query(models.Chair).all()
    
    result = []
    for chair in chairs:
        result.append({
            "id": chair.id,
            "status": chair.status,
            "patient": chair.patient_name,
            "patientPhone": chair.patient_phone,
            "waitTime": chair.wait_time,
            "lastUpdate": chair.updated_at.strftime("%H:%M:%S") if chair.updated_at else None
        })
    
    return result


@app.post("/api/chairs/{chair_id}")
def update_chair(chair_id: int, update: ChairUpdate, db: Session = Depends(get_db)):
    """체어 상태 업데이트"""
    chair = db.query(models.Chair).filter(models.Chair.id == chair_id).first()
    
    if not chair:
        raise HTTPException(status_code=404, detail="Chair not found")
    
    # 진료 시작
    if update.status == "active" and chair.status == "idle":
        chair.status = "active"
        chair.patient_name = update.patient_name
        chair.patient_phone = update.patient_phone
        chair.started_at = datetime.now()
        chair.wait_time = 30  # 예상 진료 시간
        
        # 대기열에서 제거
        if update.patient_name:
            patient = db.query(models.Patient).filter(
                models.Patient.name == update.patient_name,
                models.Patient.is_waiting == True
            ).first()
            if patient:
                patient.is_waiting = False
    
    # 진료 종료
    elif update.status == "idle" and chair.status == "active":
        # 진료 기록 저장
        if chair.patient_name and chair.started_at:
            duration = int((datetime.now() - chair.started_at).total_seconds() / 60)
            history = models.TreatmentHistory(
                chair_id=chair.id,
                patient_name=chair.patient_name,
                patient_phone=chair.patient_phone or "",
                treatment_type="일반진료",
                started_at=chair.started_at,
                duration=duration
            )
            db.add(history)
        
        chair.status = "idle"
        chair.patient_name = None
        chair.patient_phone = None
        chair.wait_time = 0
        chair.started_at = None
    
    db.commit()
    db.refresh(chair)
    
    return {
        "id": chair.id,
        "status": chair.status,
        "patient": chair.patient_name,
        "patientPhone": chair.patient_phone,
        "waitTime": chair.wait_time,
        "lastUpdate": chair.updated_at.strftime("%H:%M:%S")
    }


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """운영 통계 데이터 반환"""
    # 활성 체어 수
    active_chairs = db.query(models.Chair).filter(models.Chair.status == "active").count()
    
    # 평균 대기시간
    chairs = db.query(models.Chair).all()
    avg_wait_time = sum(c.wait_time for c in chairs) / len(chairs) if chairs else 0
    
    # 오늘 진료 완료 건수
    today = datetime.now().date()
    total_treatments = db.query(models.TreatmentHistory).filter(
        func.date(models.TreatmentHistory.ended_at) == today
    ).count()
    
    # 대기 환자 수
    waiting_count = db.query(models.Patient).filter(models.Patient.is_waiting == True).count()
    
    # 시간대별 진료 데이터 (최근 8시간)
    hourly_data = []
    for i in range(8):
        hour_start = datetime.now().replace(minute=0, second=0, microsecond=0) - timedelta(hours=7-i)
        hour_end = hour_start + timedelta(hours=1)
        
        treatments = db.query(models.TreatmentHistory).filter(
            models.TreatmentHistory.ended_at >= hour_start,
            models.TreatmentHistory.ended_at < hour_end
        ).count()
        
        efficiency = min(100, treatments * 20) if treatments > 0 else 0
        
        hourly_data.append({
            "hour": hour_start.strftime("%H:00"),
            "treatments": treatments,
            "efficiency": efficiency
        })
    
    # 장비 가동률 계산 (활성 체어 비율)
    equipment_usage = (active_chairs / 5 * 100) if active_chairs > 0 else 0
    
    return {
        "totalTreatments": total_treatments,
        "activeChairs": active_chairs,
        "avgWaitTime": round(avg_wait_time, 1),
        "equipmentUsage": round(equipment_usage, 1),
        "hourlyData": hourly_data,
        "waitingCount": waiting_count
    }


@app.get("/api/queue", response_model=List[PatientResponse])
def get_queue(db: Session = Depends(get_db)):
    """대기열 리스트 반환"""
    patients = db.query(models.Patient).filter(models.Patient.is_waiting == True).order_by(
        models.Patient.priority.desc(),
        models.Patient.arrival_time
    ).all()
    
    result = []
    for patient in patients:
        result.append({
            "id": patient.id,
            "name": patient.name,
            "phone": patient.phone,
            "type": patient.treatment_type,
            "priority": patient.priority,
            "arrivalTime": patient.arrival_time.strftime("%H:%M")
        })
    
    return result


@app.post("/api/queue")
def add_to_queue(patient: PatientCreate, db: Session = Depends(get_db)):
    """대기열에 환자 추가"""
    new_patient = models.Patient(
        name=patient.name,
        phone=patient.phone,
        treatment_type=patient.treatment_type,
        priority=patient.priority,
        is_waiting=True
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    return {
        "id": new_patient.id,
        "name": new_patient.name,
        "phone": new_patient.phone,
        "type": new_patient.treatment_type,
        "priority": new_patient.priority,
        "arrivalTime": new_patient.arrival_time.strftime("%H:%M")
    }


@app.delete("/api/queue/{patient_id}")
def remove_from_queue(patient_id: int, db: Session = Depends(get_db)):
    """대기열에서 환자 제거"""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db.delete(patient)
    db.commit()
    
    return {"success": True}


@app.get("/api/history")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    """진료 기록 조회"""
    history = db.query(models.TreatmentHistory).order_by(
        models.TreatmentHistory.ended_at.desc()
    ).limit(limit).all()
    
    result = []
    for record in history:
        result.append({
            "id": record.id,
            "chairId": record.chair_id,
            "patientName": record.patient_name,
            "patientPhone": record.patient_phone,
            "treatmentType": record.treatment_type,
            "startedAt": record.started_at.strftime("%Y-%m-%d %H:%M"),
            "endedAt": record.ended_at.strftime("%Y-%m-%d %H:%M"),
            "duration": record.duration,
            "notes": record.notes
        })
    
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
