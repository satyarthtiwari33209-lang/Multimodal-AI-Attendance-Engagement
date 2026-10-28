from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from database import get_db
from models.student import Student
from schemas.student import StudentCreate, StudentUpdate, StudentResponse, BiometricEnrollRequest
from services.vision import vision_module

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse])
def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all registered students."""
    students = db.query(Student).offset(skip).limit(limit).all()
    return students

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    """Enroll a new student."""
    existing = db.query(Student).filter(
        (Student.student_id == payload.student_id) | (Student.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student ID or Email already registered"
        )
    
    student = Student(
        student_id=payload.student_id,
        name=payload.name,
        email=payload.email,
        department=payload.department,
        avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={payload.student_id}",
        enrolled_courses=payload.enrolled_courses,
        biometric_face_registered=False
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get single student details."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student

@router.post("/{student_id}/enroll-face")
def enroll_student_face(student_id: int, payload: BiometricEnrollRequest, db: Session = Depends(get_db)):
    """
    Extracts biometric feature vector from uploaded face photo
    and associates it with the student record for automatic face recognition.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    pil_img = vision_module.decode_base64_image(payload.image_base64)
    if not pil_img:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image encoding")

    feature_vec = vision_module.extract_biometric_encoding(pil_img)
    student.face_encoding = json.dumps(feature_vec)
    student.biometric_face_registered = True
    
    db.commit()
    return {
        "success": True,
        "message": f"Biometric template successfully enrolled for {student.name}",
        "features_extracted": len(feature_vec)
    }
