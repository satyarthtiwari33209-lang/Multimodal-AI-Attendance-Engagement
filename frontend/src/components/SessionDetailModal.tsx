import React from 'react';
import {
  X,
  Clock,
  Eye,
  Mic,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Activity
} from 'lucide-react';
import type { ClassSession, AttendanceRecord } from '../types';

interface SessionDetailModalProps {
  session: ClassSession;
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
  onStartSession: (id: number) => void;
  onStopSession: (id: number) => void;
  onNavigateToWorkspace: (id: number) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  attendanceRecords,
  onClose,
  onStartSession,
  onStopSession,
  onNavigateToWorkspace
}) => {
  const isLive = session.status === 'live';
  const isCompleted = session.status === 'completed';

  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length;

  const startDate = new Date(session.start_time);
  const endDate = session.end_time ? new Date(session.end_time) : null;
  const durationMinutes = endDate
    ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
    : isLive
    ? Math.max(1, Math.round((Date.now() - startDate.getTime()) / (1000 * 60)))
    : 60;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '20px'
      }}
    >
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        padding: '30px',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            color: 'var(--slate-400)',
            padding: '6px',
            borderRadius: '50%',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Header Status & Code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor:
              isLive ? 'var(--emerald-50)' : isCompleted ? 'var(--slate-100)' : 'var(--indigo-50)',
            color:
              isLive ? 'var(--emerald-700)' : isCompleted ? 'var(--slate-700)' : 'var(--indigo-700)',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {isLive && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--emerald-500)', animation: 'pulseDot 2s infinite' }} />}
            {session.status}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-500)', fontFamily: 'monospace' }}>
            {session.session_code}
          </span>
        </div>

        <h2 id="session-detail-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)' }}>
          {session.course_name}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--slate-600)', marginTop: '4px' }}>
          {session.topic}
        </p>

        {/* Timestamps Section */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--slate-50)',
          border: '1px solid var(--slate-200)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
              Start Time
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--slate-500)" />
              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
              {startDate.toLocaleDateString()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
              End Time
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="var(--slate-500)" />
              {endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : isLive ? 'Ongoing Stream' : '—'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
              {endDate ? endDate.toLocaleDateString() : isLive ? 'Active now' : 'Scheduled'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
              Elapsed Duration
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-600)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} />
              {durationMinutes} minutes
            </div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
              {isLive ? 'Real-time telemetry' : 'Logged duration'}
            </div>
          </div>
        </div>

        {/* Modality Indicators Section */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-900)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            Active Multimodal Telemetry Modalities
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Vision Modality */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>
                    Computer Vision Pipeline
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                    Face detection • 32-dim Biometric Matching • Gaze vectors • EAR Drowsiness
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--emerald-700)', backgroundColor: 'var(--emerald-50)', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                60% FUSION WEIGHT
              </span>
            </div>

            {/* Audio Modality */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', backgroundColor: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>
                    Acoustic Telemetry Pipeline
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                    Voice Activity Detection (VAD) • Decibel RMS • Classroom acoustic context
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0e7490', backgroundColor: '#ecfeff', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                40% FUSION WEIGHT
              </span>
            </div>

            {/* AI Agent Modality */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--amber-50)', color: 'var(--amber-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>
                    Pedagogical Recommendation Agent
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
                    Cognitive friction detection • Fatigue alert dispatcher • Lecture recap generator
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--amber-700)', backgroundColor: 'var(--amber-50)', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>
                AUTONOMOUS AGENT
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Breakdown for this session */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-900)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
            Roster Status
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--emerald-50)', color: 'var(--emerald-800)', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> Present: {presentCount}
            </div>
            <div style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--amber-50)', color: 'var(--amber-800)', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} /> Late: {lateCount}
            </div>
            <div style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--rose-50)', color: 'var(--rose-800)', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} /> Absent: {absentCount}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--slate-500)' }}>
            <MapPin size={14} /> Room: {session.room} • {session.instructor}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isLive ? (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToWorkspace(session.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-600)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  <Play size={14} /> Open Live Workspace
                </button>
                <button
                  onClick={() => onStopSession(session.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--rose-300)',
                    backgroundColor: 'var(--rose-50)',
                    color: 'var(--rose-700)',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  <Square size={14} /> End Session
                </button>
              </>
            ) : (
              <button
                onClick={() => onStartSession(session.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-600)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <Play size={14} /> Launch Live Stream
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
