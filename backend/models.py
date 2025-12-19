from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from sqlalchemy.sql import func
from database import Base

class Chair(Base):
    __tablename__ = "chairs"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="idle")  # idle, active, maintenance
    patient_name = Column(String, nullable=True)
    patient_phone = Column(String, nullable=True)
    wait_time = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    treatment_type = Column(String, nullable=False)
    priority = Column(String, default="normal")  # normal, high
    arrival_time = Column(DateTime, server_default=func.now())
    is_waiting = Column(Boolean, default=True)

class TreatmentHistory(Base):
    __tablename__ = "treatment_history"
    
    id = Column(Integer, primary_key=True, index=True)
    chair_id = Column(Integer, nullable=False)
    patient_name = Column(String, nullable=False)
    patient_phone = Column(String, nullable=False)
    treatment_type = Column(String, nullable=False)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, server_default=func.now())
    duration = Column(Integer, nullable=True)  # 분 단위
    notes = Column(String, nullable=True)
