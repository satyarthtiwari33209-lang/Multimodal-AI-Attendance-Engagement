import datetime
import json
import random
from sqlalchemy.orm import Session

from database import engine, SessionLocal, Base
from models.student import Student
from models.session import ClassSession
from models.attendance import AttendanceRecord
from models.engagement import EngagementLog
from models.insight import AgentInsight

DEMO_STUDENTS = [
    {
        "student_id": "STU-2026-001",
        "name": "Aarav Sharma",
        "email": "aarav.sharma@university.edu",
        "department": "Computer Science & AI",
        "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
        "enrolled_courses": "CS-401,DS-204,AI-502",
        "biometric_face_registered": True
    },
    {
        "student_id": "STU-2026-002",
        "name": "Sophia Chen",
        "email": "sophia.chen@university.edu",
        "department": "Computer Science & AI",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        "enrolled_courses": "CS-401,DS-204,AI-502",
        "biometric_face_registered": True
    },
    {
        "student_id": "STU-2026-003",
        "name": "Marcus Vance",
        "email": "marcus.vance@university.edu",
        "department": "Data Science",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        "enrolled_courses": "CS-401,DS-204",
        "biometric_face_registered": True
    },
    {
        "student_id": "STU-2026-004",
        "name": "Priya Patel",
        "email": "priya.patel@university.edu",
        "department": "Software Engineering",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "enrolled_courses": "CS-401,AI-502",
        "biometric_face_registered": True
    },
    {
        "student_id": "STU-2026-005",
        "name": "Liam O'Connor",
        "email": "liam.oconnor@university.edu",
        "department": "Computer Science",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        "enrolled_courses": "CS-401,DS-204",
        "biometric_face_registered": True
    },
    {
        "student_id": "STU-2026-006",
        "name": "Elena Rostova",
        "email": "elena.rostova@university.edu",
        "department": "Cognitive Computing",
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        "enrolled_courses": "CS-401,AI-502",
        "biometric_face_registered": True
    },
    {
        "student_id": "STU-2026-007",
        "name": "David Kim",
        "email": "david.kim@university.edu",
        "department": "Computer Science & AI",
        "avatar_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
        "enrolled_courses": "CS-401,DS-204,AI-502",
        "biometric_face_registered": True
    },
    {
        "student_id": "STU-2026-008",
        "name": "Zoe Al-Mansoor",
        "email": "zoe.mansoor@university.edu",
        "department": "Information Systems",
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        "enrolled_courses": "CS-401,DS-204",
        "biometric_face_registered": True
    }
]

def seed_database(db: Session):
    """Populates the database with realistic initial demo data if empty."""
    if db.query(Student).count() > 0:
        return  # Already seeded

    print("[Seeder] Initializing demo data for Multimodal Attendance & Engagement Agent...")

    # 1. Create Students with synthesized face biometric templates
    created_students = []
    for s_info in DEMO_STUDENTS:
        # Generate stable 32-dim mock encoding
        random.seed(s_info["student_id"])
        mock_encoding = [round(random.uniform(-1.0, 1.0), 4) for _ in range(32)]
        
        stu = Student(
            student_id=s_info["student_id"],
            name=s_info["name"],
            email=s_info["email"],
            department=s_info["department"],
            avatar_url=s_info["avatar_url"],
            enrolled_courses=s_info["enrolled_courses"],
            biometric_face_registered=s_info["biometric_face_registered"],
            face_encoding=json.dumps(mock_encoding),
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=30)
        )
        db.add(stu)
        created_students.append(stu)
    
    db.commit()
    for s in created_students:
        db.refresh(s)

    # 2. Create Class Sessions
    now = datetime.datetime.utcnow()
    
    # Live Session
    live_session = ClassSession(
        session_code="CS-401-2026",
        course_name="CS 401: Deep Learning & Attention Mechanics",
        instructor="Dr. Robert Vance",
        room="Hall 3B / Virtual Lab",
        topic="Multi-Head Attention Layers and Transformer Convergence",
        status="live",
        start_time=now - datetime.timedelta(minutes=35),
        created_at=now - datetime.timedelta(minutes=40)
    )
    db.add(live_session)

    # Completed Session
    past_session = ClassSession(
        session_code="DS-204-2026",
        course_name="DS 204: Advanced Data Structures & Algorithms",
        instructor="Prof. Sarah Jenkins",
        room="Lecture Hall 1A",
        topic="Self-Balancing Red-Black Trees and B-Tree Paging",
        status="completed",
        start_time=now - datetime.timedelta(days=1, hours=2),
        end_time=now - datetime.timedelta(days=1),
        created_at=now - datetime.timedelta(days=1, hours=3)
    )
    db.add(past_session)

    # Scheduled Session
    future_session = ClassSession(
        session_code="AI-502-2026",
        course_name="AI 502: Multimodal Machine Learning Architectures",
        instructor="Dr. Robert Vance",
        room="Seminar Room 4",
        topic="Cross-Attention Fusion for Vision-Language Alignment",
        status="scheduled",
        start_time=now + datetime.timedelta(days=1, hours=10),
        created_at=now
    )
    db.add(future_session)
    db.commit()
    db.refresh(live_session)
    db.refresh(past_session)

    # 3. Create Attendance Records for Live Session
    for idx, stu in enumerate(created_students):
        status = "present" if idx < 7 else "late"
        confidence = round(0.92 + (idx * 0.01), 2)
        att = AttendanceRecord(
            session_id=live_session.id,
            student_id=stu.id,
            timestamp=live_session.start_time + datetime.timedelta(minutes=idx + 1),
            status=status,
            verification_method="biometric_face",
            confidence_score=confidence,
            notes="Automatic biometric match at entry threshold" if status == "present" else "Late entry detected via camera feed"
        )
        db.add(att)

        # Past session attendance
        past_status = "present" if idx != 2 else "absent"
        past_att = AttendanceRecord(
            session_id=past_session.id,
            student_id=stu.id,
            timestamp=past_session.start_time + datetime.timedelta(minutes=idx),
            status=past_status,
            verification_method="biometric_face" if past_status != "absent" else "manual",
            confidence_score=0.96 if past_status != "absent" else 0.0,
            notes="Session archived"
        )
        db.add(past_att)

    # 4. Create Historical Engagement Logs for Live Session (35-minute time series)
    for m in range(0, 36, 2):
        log_time = live_session.start_time + datetime.timedelta(minutes=m)
        # Synthetic variation with realistic curves
        if m < 10:
            # High initial focus
            att = round(0.88 + random.uniform(-0.04, 0.06), 2)
            aud = round(0.18 + random.uniform(0.0, 0.08), 2)
            drowsy = False
            emotion = "focused"
        elif 16 <= m <= 22:
            # Complex topic explanation - slight confusion spike
            att = round(0.72 + random.uniform(-0.06, 0.05), 2)
            aud = round(0.04 + random.uniform(0.0, 0.03), 2)
            drowsy = False
            emotion = "confused"
        elif m >= 28:
            # Minor fatigue near minute 30
            att = round(0.79 + random.uniform(-0.05, 0.08), 2)
            aud = round(0.24 + random.uniform(0.0, 0.10), 2)
            drowsy = (m == 30)
            emotion = "distracted" if drowsy else "focused"
        else:
            att = round(0.84 + random.uniform(-0.05, 0.07), 2)
            aud = round(0.15 + random.uniform(0.0, 0.06), 2)
            drowsy = False
            emotion = "neutral"

        fused = round((att * 0.60) + (min(1.0, aud * 2.5 + 0.4) * 0.40), 2)
        
        # Pick student for log
        sampled_stu = created_students[m % len(created_students)]
        
        log = EngagementLog(
            session_id=live_session.id,
            student_id=sampled_stu.id,
            timestamp=log_time,
            attention_score=att,
            eye_contact_score=round(att * 0.95, 2),
            drowsiness_detected=drowsy,
            head_pitch=round(random.uniform(-3.0, 4.0), 1),
            head_yaw=round(random.uniform(-4.0, 5.0), 1),
            emotion=emotion,
            audio_energy=aud,
            speech_detected=(aud > 0.08),
            fused_engagement_score=fused
        )
        db.add(log)

    # 5. Create Initial Agent Insights & Recommendations
    demo_insights = [
        {
            "type": "alert",
            "title": "Fatigue Indicator: Marcus Vance",
            "message": "Persistent low Eye Aspect Ratio (< 0.21) observed over minute 28-30. Suggesting quick conceptual poll or stand-and-stretch pause.",
            "severity": "medium",
            "target_student_id": created_students[2].id,
            "is_resolved": False
        },
        {
            "type": "intervention",
            "title": "Conceptual Friction Detected (Min 18)",
            "message": "Elevated confusion indicators detected across 37% of students during 'Matrix Multi-Head Projection'. Recommend re-explaining the query-key dimensional dot product.",
            "severity": "high",
            "target_student_id": None,
            "is_resolved": True,
            "resolution_note": "Instructor provided 2-minute visual diagram on whiteboard."
        },
        {
            "type": "strategy",
            "title": "High Audio Participation Phase",
            "message": "Vocal activity and peer interaction spiked during question checkpoint (minute 24). Group discussions significantly heightened downstream visual attention.",
            "severity": "low",
            "target_student_id": None,
            "is_resolved": False
        },
        {
            "type": "praise",
            "title": "Seamless Biometric Roll Call",
            "message": "7 out of 8 students verified automatically within 8 minutes of session start with average facial confidence of 94.6%.",
            "severity": "low",
            "target_student_id": None,
            "is_resolved": False
        }
    ]

    for ins in demo_insights:
        insight_obj = AgentInsight(
            session_id=live_session.id,
            timestamp=now - datetime.timedelta(minutes=random.randint(5, 25)),
            type=ins["type"],
            title=ins["title"],
            message=ins["message"],
            severity=ins["severity"],
            target_student_id=ins["target_student_id"],
            is_resolved=ins["is_resolved"],
            resolution_note=ins.get("resolution_note")
        )
        db.add(insight_obj)

    db.commit()

    # 6. Seed Deterministic Rule-Based Recommendations for Session 1 & Session 2
    try:
        from services.rule_reasoning_engine import rule_reasoning_engine
        rule_reasoning_engine.generate_recommendations_for_session(db=db, session_id=live_session.id)
        rule_reasoning_engine.generate_recommendations_for_session(db=db, session_id=past_session.id)
    except Exception as e:
        print(f"[Seeder] Warning: Could not pre-evaluate rule recommendations: {e}")

    print("[Seeder] Demo database successfully seeded with 8 students, 3 sessions, attendance, time-series logs, AI insights, and rule recommendations!")

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    seed_database(session)
    session.close()
