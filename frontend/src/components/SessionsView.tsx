import React, { useState, useMemo } from 'react';
import {
  Plus,
  Play,
  Square,
  Users,
  MapPin,
  X,
  Search,
  Eye,
  Calendar
} from 'lucide-react';
import type { ClassSession } from '../types';
import { api } from '../services/api';

interface SessionsViewProps {
  sessions: ClassSession[];
  onRefreshSessions: () => void;
  onNavigateTab: (tab: string) => void;
  onSelectSession: (id: number) => void;
  onOpenSessionDetail: (session: ClassSession) => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({
  sessions,
  onRefreshSessions,
  onNavigateTab,
  onSelectSession,
  onOpenSessionDetail
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [instructor, setInstructor] = useState('Dr. Robert Vance');
  const [room, setRoom] = useState('Hall 3B / Virtual Lab');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'completed' | 'scheduled'>('all');

  const filteredSessions = useMemo(() => {
    return sessions.filter((sess) => {
      const matchesSearch =
        sess.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sess.session_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sess.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sess.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchQuery, statusFilter]);

  const handleStart = async (sessionId: number) => {
    try {
      await api.startSession(sessionId);
      onSelectSession(sessionId);
      onRefreshSessions();
      onNavigateTab('workspace');
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleStop = async (sessionId: number) => {
    try {
      await api.stopSession(sessionId);
      onRefreshSessions();
    } catch (err) {
      console.error('Failed to stop session:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode || !courseName) return;
    setIsSubmitting(true);
    try {
      const newSess = await api.createSession({
        session_code: sessionCode,
        course_name: courseName,
        instructor,
        room,
        topic: topic || 'General Lecture & Discussion'
      });
      setShowCreateModal(false);
      setSessionCode('');
      setCourseName('');
      setTopic('');
      onRefreshSessions();
      onSelectSession(newSess.id);
    } catch (err: any) {
      alert(`Error creating session: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Deck */}
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
            Classroom Session Management
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Schedule lectures, view modality indicators, launch live multimodal monitoring, and view historical engagement logs
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          aria-label="Create new class session"
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
          <Plus size={16} /> Create New Class Session
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--slate-50)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--slate-200)',
          width: '280px'
        }}>
          <Search size={16} color="var(--slate-400)" />
          <input
            type="text"
            aria-label="Search class sessions"
            placeholder="Search course or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              width: '100%',
              color: 'var(--slate-800)'
            }}
          />
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'live', 'completed', 'scheduled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              aria-label={`Filter by ${st}`}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor: statusFilter === st ? 'var(--primary-50)' : 'transparent',
                color: statusFilter === st ? 'var(--primary-700)' : 'var(--slate-600)',
                border: statusFilter === st ? '1px solid var(--primary-200)' : '1px solid transparent'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {filteredSessions.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            backgroundColor: 'var(--bg-surface)',
            padding: '48px 24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)',
            textAlign: 'center',
            color: 'var(--slate-400)'
          }}>
            <Calendar size={36} style={{ margin: '0 auto 8px', color: 'var(--slate-400)' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-700)' }}>
              No Class Sessions Found
            </div>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              No sessions match your search or filter. Try clearing filters or create a new session.
            </p>
          </div>
        ) : (
          filteredSessions.map((sess) => {
            const isLive = sess.status === 'live';
            const isCompleted = sess.status === 'completed';

            return (
              <div
                key={sess.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  border: isLive ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                  boxShadow: isLive ? 'var(--shadow-blue)' : 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '18px',
                  position: 'relative'
                }}
              >
                {/* Header Status & Code */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
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
                    {sess.status}
                  </span>

                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', fontFamily: 'monospace' }}>
                    {sess.session_code}
                  </span>
                </div>

                {/* Title & Topic */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
                    {sess.course_name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '4px', lineHeight: 1.4 }}>
                    {sess.topic}
                  </p>
                </div>

                {/* Location & Details */}
                <div style={{ fontSize: '12px', color: 'var(--slate-500)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} color="var(--slate-400)" />
                    <span>{sess.room}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={14} color="var(--slate-400)" />
                    <span>Instructor: {sess.instructor}</span>
                  </div>
                </div>

                {/* Metrics pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--slate-50)',
                  fontSize: '12px'
                }}>
                  <div>
                    <span style={{ color: 'var(--slate-500)' }}>Attending: </span>
                    <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                      {sess.attendance_count ?? 0} Students
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-500)' }}>Engagement: </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                      {sess.average_engagement ?? 82}%
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
                  <button
                    onClick={() => onOpenSessionDetail(sess)}
                    aria-label={`View details for ${sess.course_name}`}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--slate-300)',
                      backgroundColor: 'var(--slate-50)',
                      color: 'var(--slate-700)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={14} /> Details
                  </button>

                  {isLive ? (
                    <>
                      <button
                        onClick={() => {
                          onSelectSession(sess.id);
                          onNavigateTab('workspace');
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--primary-600)',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: 600
                        }}
                      >
                        <Play size={14} /> Open Live Workspace
                      </button>
                      <button
                        onClick={() => handleStop(sess.id)}
                        aria-label="Conclude session"
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--rose-200)',
                          backgroundColor: 'var(--rose-50)',
                          color: 'var(--rose-600)',
                          fontSize: '12.5px',
                          fontWeight: 600
                        }}
                        title="Conclude Session"
                      >
                        <Square size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStart(sess.id)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--primary-50)',
                          border: '1px solid var(--primary-200)',
                          color: 'var(--primary-700)',
                          fontSize: '12.5px',
                          fontWeight: 600
                        }}
                      >
                        <Play size={14} /> Start Live Session
                      </button>
                      <button
                        onClick={() => {
                          onSelectSession(sess.id);
                          onNavigateTab('attendance');
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--slate-300)',
                          color: 'var(--slate-700)',
                          fontSize: '12.5px',
                          fontWeight: 600
                        }}
                        title="View Attendance Records"
                      >
                        Roster
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
            maxWidth: '460px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            padding: '24px',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowCreateModal(false)}
              aria-label="Close modal"
              style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--slate-400)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--slate-900)' }}>
              Create Class Session
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
              Set up a new lecture for attendance and multimodal engagement tracking
            </p>

            <form onSubmit={handleCreate} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                  Session Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-405-2026"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
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
                  Course Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS 405: Computer Vision & Biometrics"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
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
                  Lecture Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Saccadic Eye Movement & Facial Action Units"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                    Room / Lab
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
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
                    Instructor
                  </label>
                  <input
                    type="text"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
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
                {isSubmitting ? 'Creating...' : 'Create Session'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
