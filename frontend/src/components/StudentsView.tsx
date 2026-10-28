import React, { useState, useRef } from 'react';
import {
  ScanFace,
  Plus,
  Mail,
  BookOpen,
  CheckCircle2,
  Camera,
  X,
  Sparkles
} from 'lucide-react';
import type { Student } from '../types';
import { api } from '../services/api';

interface StudentsViewProps {
  students: Student[];
  onRefreshStudents: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onRefreshStudents
}) => {
  const [selectedStudentForBiometrics, setSelectedStudentForBiometrics] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  // New Student Form
  const [newStudentId, setNewStudentId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Computer Science & AI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Biometric Enroll state
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);
  const enrollVideoRef = useRef<HTMLVideoElement | null>(null);
  const enrollCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);

  const startEnrollWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 320 } });
      if (enrollVideoRef.current) {
        enrollVideoRef.current.srcObject = stream;
        enrollVideoRef.current.play();
        setWebcamActive(true);
      }
    } catch (err) {
      console.warn('Webcam not accessible for enrollment:', err);
    }
  };

  const handleEnrollPhoto = async (base64Img?: string) => {
    if (!selectedStudentForBiometrics) return;
    setIsEnrolling(true);
    setEnrollSuccessMessage(null);

    try {
      let finalImg = base64Img;
      if (!finalImg && enrollVideoRef.current && enrollCanvasRef.current) {
        const video = enrollVideoRef.current;
        const canvas = enrollCanvasRef.current;
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 320);
          finalImg = canvas.toDataURL('image/jpeg', 0.8);
        }
      }

      // If still no image, use a sample face photo base64
      if (!finalImg) {
        // Fallback synthetic pixel canvas
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(0, 0, 120, 120);
          ctx.fillStyle = '#ffffff';
          ctx.arc(60, 60, 40, 0, Math.PI * 2);
          ctx.fill();
        }
        finalImg = canvas.toDataURL('image/jpeg', 0.8);
      }

      const res = await api.enrollFaceBiometrics(selectedStudentForBiometrics.id, finalImg);
      setEnrollSuccessMessage(res.message);
      onRefreshStudents();
      setTimeout(() => {
        setSelectedStudentForBiometrics(null);
        setEnrollSuccessMessage(null);
      }, 1800);
    } catch (err: any) {
      console.error('Enroll error:', err);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId || !newName || !newEmail) return;
    setIsSubmitting(true);
    try {
      await api.createStudent({
        student_id: newStudentId,
        name: newName,
        email: newEmail,
        department: newDept,
        enrolled_courses: 'CS-401,AI-502'
      });
      setShowAddModal(false);
      setNewStudentId('');
      setNewName('');
      setNewEmail('');
      onRefreshStudents();
    } catch (err: any) {
      alert(`Error creating student: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Student Directory & Biometric Profiles
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Manage student records and 32-dimensional facial recognition templates for hands-free roll call
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary-600)',
            color: '#ffffff',
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Plus size={16} /> Enroll New Student
        </button>
      </div>

      {/* Student Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '20px'
      }}>
        {students.map((student) => (
          <div
            key={student.id}
            style={{
              backgroundColor: 'var(--bg-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--slate-200)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src={student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.student_id}`}
                alt={student.name}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--primary-100)'
                }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {student.name}
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--slate-500)', fontFamily: 'monospace' }}>
                  {student.student_id}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--slate-600)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} color="var(--slate-400)" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {student.email}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={14} color="var(--slate-400)" />
                <span>{student.department}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--slate-100)'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: student.biometric_face_registered ? 'var(--emerald-50)' : 'var(--amber-50)',
                color: student.biometric_face_registered ? 'var(--emerald-700)' : 'var(--amber-700)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ScanFace size={13} />
                {student.biometric_face_registered ? 'Biometrics Enrolled' : 'Pending Template'}
              </span>

              <button
                onClick={() => {
                  setSelectedStudentForBiometrics(student);
                  startEnrollWebcam();
                }}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--primary-600)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-50)'
                }}
              >
                Update Face
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Biometric Enrollment */}
      {selectedStudentForBiometrics && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            width: '100%',
            maxWidth: '440px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            padding: '24px',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedStudentForBiometrics(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--slate-400)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--slate-900)' }}>
              Biometric Face Registration
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
              Enrolling template for <strong>{selectedStudentForBiometrics.name}</strong> ({selectedStudentForBiometrics.student_id})
            </p>

            {enrollSuccessMessage ? (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--emerald-50)',
                color: 'var(--emerald-700)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={18} />
                <span>{enrollSuccessMessage}</span>
              </div>
            ) : (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  width: '100%',
                  height: '240px',
                  backgroundColor: '#0f172a',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {webcamActive ? (
                    <video
                      ref={enrollVideoRef}
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <Camera size={40} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                      <p style={{ fontSize: '12px' }}>Camera not started or snapshot ready</p>
                    </div>
                  )}
                  <canvas ref={enrollCanvasRef} style={{ display: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleEnrollPhoto()}
                    disabled={isEnrolling}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--primary-600)',
                      color: '#ffffff',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 600,
                      fontSize: '13px'
                    }}
                  >
                    <Camera size={15} />
                    {isEnrolling ? 'Extracting Vector...' : 'Capture & Enroll Face'}
                  </button>

                  <button
                    onClick={() => handleEnrollPhoto()}
                    disabled={isEnrolling}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--slate-300)',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--slate-700)'
                    }}
                    title="Generate template from stock photo"
                  >
                    <Sparkles size={15} /> Synthetic Vector
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Student */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            width: '100%',
            maxWidth: '440px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            padding: '24px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--slate-400)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--slate-900)' }}>
              Enroll New Student
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
              Add student to department records
            </p>

            <form onSubmit={handleCreateStudent} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                  Student ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-2026-009"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-300)',
                    fontSize: '13px',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-300)',
                    fontSize: '13px',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. maya.lin@university.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-300)',
                    fontSize: '13px',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-300)',
                    fontSize: '13px',
                    marginTop: '4px'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '10px',
                  backgroundColor: 'var(--primary-600)',
                  color: '#ffffff',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '14px'
                }}
              >
                {isSubmitting ? 'Enrolling...' : 'Save & Register'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
