import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverviewView } from './components/DashboardOverviewView';
import { LiveMonitorView } from './components/LiveMonitorView';
import { AttendanceView } from './components/AttendanceView';
import { AnalyticsView } from './components/AnalyticsView';
import { InsightsView } from './components/InsightsView';
import { StudentsView } from './components/StudentsView';
import { SessionsView } from './components/SessionsView';
import { SettingsView } from './components/SettingsView';
import { VisionScannerView } from './components/VisionScannerView';
import { AudioIntelligenceView } from './components/AudioIntelligenceView';
import { SessionDetailModal } from './components/SessionDetailModal';
import { CollegeProjectDemoModal } from './components/CollegeProjectDemoModal';
import { api } from './services/api';
import type {
  ClassSession,
  DashboardOverview,
  SessionTrends,
  AgentInsight,
  Student,
  StudentLeaderboardItem,
  AttendanceRecord
} from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Global State
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number>(1);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [trends, setTrends] = useState<SessionTrends | null>(null);
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [leaderboard, setLeaderboard] = useState<StudentLeaderboardItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Modals
  const [selectedDetailSession, setSelectedDetailSession] = useState<ClassSession | null>(null);
  const [showDemoTourModal, setShowDemoTourModal] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Fetch all initial data
  const loadAllData = useCallback(async () => {
    try {
      setBackendError(null);
      const [
        fetchedOverview,
        fetchedSessions,
        fetchedStudents,
        fetchedLeaderboard
      ] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getSessions().catch(() => []),
        api.getStudents().catch(() => []),
        api.getLeaderboard().catch(() => [])
      ]);

      if (fetchedOverview) setOverview(fetchedOverview);
      if (fetchedSessions && fetchedSessions.length > 0) {
        setSessions(fetchedSessions);
        // Default to live session if available
        const live = fetchedSessions.find((s) => s.status === 'live');
        const defaultId = live ? live.id : fetchedSessions[0].id;
        setSelectedSessionId((prev) => (prev ? prev : defaultId));
      }
      if (fetchedStudents) setStudents(fetchedStudents);
      if (fetchedLeaderboard) setLeaderboard(fetchedLeaderboard);
    } catch (err: any) {
      console.warn('Initial data load error:', err);
      setBackendError(
        'Unable to communicate with FastAPI backend. Ensure the backend is running at http://localhost:8000.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch session-specific data
  const loadSessionDetails = useCallback(async (sessionId: number) => {
    if (!sessionId) return;
    try {
      const [fetchedTrends, fetchedInsights, fetchedAttendance] = await Promise.all([
        api.getSessionTrends(sessionId).catch(() => null),
        api.getInsights(sessionId).catch(() => []),
        api.getSessionAttendance(sessionId).catch(() => [])
      ]);

      if (fetchedTrends) setTrends(fetchedTrends);
      if (fetchedInsights) setInsights(fetchedInsights);
      if (fetchedAttendance) setAttendanceRecords(fetchedAttendance);
    } catch (err) {
      console.warn('Session details load error:', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionDetails(selectedSessionId);
    }
  }, [selectedSessionId, loadSessionDetails]);

  // Quick Ingestion Pulse
  const handleQuickSimulate = async () => {
    setIsSimulating(true);
    try {
      await api.processMultimodalFrame({
        session_id: selectedSessionId,
        audio_level: 0.18,
        mark_attendance_if_matched: true,
        simulate_multi_student: true
      });
      // Refresh current session data
      await Promise.all([
        loadSessionDetails(selectedSessionId),
        api.getOverview().then((ov) => setOverview(ov)).catch(() => {})
      ]);
    } catch (err) {
      console.error('Simulation trigger failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResolveInsight = async (insightId: number) => {
    try {
      await api.resolveInsight(insightId, 'Pedagogical action implemented');
      if (selectedSessionId) {
        const fresh = await api.getInsights(selectedSessionId);
        setInsights(fresh);
      }
    } catch (err) {
      console.error('Resolve insight failed:', err);
    }
  };

  const handleStartSession = async (sessionId: number) => {
    try {
      await api.startSession(sessionId);
      setSelectedSessionId(sessionId);
      await loadAllData();
      if (selectedDetailSession && selectedDetailSession.id === sessionId) {
        setSelectedDetailSession((prev) => (prev ? { ...prev, status: 'live' } : null));
      }
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleStopSession = async (sessionId: number) => {
    try {
      await api.stopSession(sessionId);
      await loadAllData();
      if (selectedDetailSession && selectedDetailSession.id === sessionId) {
        setSelectedDetailSession((prev) => (prev ? { ...prev, status: 'completed' } : null));
      }
    } catch (err) {
      console.error('Failed to stop session:', err);
    }
  };

  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0] || null;
  const liveSession = sessions.find((s) => s.status === 'live');

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Classroom Analytics Overview',
      subtitle: 'Real-time student attendance rate, cognitive engagement pulse, and active interventions'
    },
    workspace: {
      title: 'Multimodal Live Workspace',
      subtitle: 'Real-time perception engine: Biometric face verification, eye gaze, drowsiness & acoustics'
    },
    sessions: {
      title: 'Class Session Management',
      subtitle: 'Schedule upcoming lectures, launch live streams, and review past class archives'
    },
    attendance: {
      title: 'Attendance Roster & Biometric Verification',
      subtitle: 'Session attendance log with facial recognition confidence scores, sorting, and manual override'
    },
    analytics: {
      title: 'Engagement & Attention Analytics',
      subtitle: 'Minute-by-minute time-series correlation of visual focus, speech participation & affect'
    },
    insights: {
      title: 'AI Teaching Assistant & Pedagogical Recommendations',
      subtitle: 'Intelligent alerts for student fatigue, cognitive friction, and lecture pacing optimization'
    },
    settings: {
      title: 'Settings & Multimodal Configuration',
      subtitle: 'Configure perception thresholds, API settings, and demo dataset administration'
    },
    students: {
      title: 'Student Directory & Biometric Templates',
      subtitle: 'Student profiles with enrolled 32-dimensional facial recognition vectors'
    }
  };

  const currentHeaderInfo = tabTitles[currentTab] || {
    title: 'Multimodal Attendance & Engagement Agent',
    subtitle: 'AI Education Analytics Dashboard'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeSessionTitle={liveSession ? liveSession.course_name : undefined}
        alertsCount={insights.filter((i) => !i.is_resolved).length}
        onOpenDemoTour={() => setShowDemoTourModal(true)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          title={currentHeaderInfo.title}
          subtitle={currentHeaderInfo.subtitle}
          onQuickSimulate={handleQuickSimulate}
          isSimulating={isSimulating}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
          onNavigateTab={setCurrentTab}
          alertsCount={insights.filter((i) => !i.is_resolved).length}
          onOpenDemoTour={() => setShowDemoTourModal(true)}
        />

        <main role="main" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {backendError && (
            <div style={{
              backgroundColor: 'var(--rose-50)',
              border: '1px solid var(--rose-500)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'var(--rose-700)',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} color="var(--rose-600)" />
                <span>{backendError}</span>
              </div>
              <button
                onClick={loadAllData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--rose-600)',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600
                }}
              >
                <RefreshCw size={13} /> Retry Connection
              </button>
            </div>
          )}

          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50vh',
              gap: '12px',
              color: 'var(--slate-500)'
            }}>
              <RefreshCw size={32} className="animate-spin" color="var(--primary-600)" />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>
                Connecting to Multimodal Attendance & Engagement Agent...
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {currentTab === 'overview' && (
                <DashboardOverviewView
                  overview={overview}
                  sessions={sessions}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  trends={trends}
                  attendanceRecords={attendanceRecords}
                  insights={insights}
                  onNavigateTab={setCurrentTab}
                  onResolveInsight={handleResolveInsight}
                  onOpenSessionDetail={setSelectedDetailSession}
                  onOpenDemoTour={() => setShowDemoTourModal(true)}
                />
              )}

              {currentTab === 'workspace' && (
                <LiveMonitorView
                  activeSession={activeSession}
                  onRefreshAllData={() => {
                    loadAllData();
                    if (selectedSessionId) loadSessionDetails(selectedSessionId);
                  }}
                />
              )}

              {currentTab === 'sessions' && (
                <SessionsView
                  sessions={sessions}
                  onRefreshSessions={loadAllData}
                  onNavigateTab={setCurrentTab}
                  onSelectSession={setSelectedSessionId}
                  onOpenSessionDetail={setSelectedDetailSession}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceView
                  sessions={sessions}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  attendanceRecords={attendanceRecords}
                  onRefreshRecords={() => loadSessionDetails(selectedSessionId)}
                  onNavigateTab={setCurrentTab}
                />
              )}

              {currentTab === 'vision-scanner' && (
                <VisionScannerView
                  sessions={sessions}
                  students={students}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  onAttendanceConfirmed={() => loadSessionDetails(selectedSessionId)}
                />
              )}

              {currentTab === 'audio-intelligence' && (
                <AudioIntelligenceView />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsView trends={trends} leaderboard={leaderboard} />
              )}

              {currentTab === 'insights' && (
                <InsightsView
                  insights={insights}
                  sessions={sessions}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  onRefreshInsights={() => loadSessionDetails(selectedSessionId)}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView onRefreshAllData={loadAllData} />
              )}

              {currentTab === 'students' && (
                <StudentsView students={students} onRefreshStudents={loadAllData} />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Session Detail Modal */}
      {selectedDetailSession && (
        <SessionDetailModal
          session={selectedDetailSession}
          attendanceRecords={attendanceRecords}
          onClose={() => setSelectedDetailSession(null)}
          onStartSession={handleStartSession}
          onStopSession={handleStopSession}
          onNavigateToWorkspace={(sessionId) => {
            setSelectedSessionId(sessionId);
            setSelectedDetailSession(null);
            setCurrentTab('workspace');
          }}
        />
      )}

      {/* College Project Demo Tour Modal */}
      <CollegeProjectDemoModal
        isOpen={showDemoTourModal}
        onClose={() => setShowDemoTourModal(false)}
        onNavigateTab={setCurrentTab}
      />
    </div>
  );
};

export default App;
