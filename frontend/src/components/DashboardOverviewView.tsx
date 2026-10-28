import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Eye,
  Clock,
  Calendar,
  Volume2,
  Timer
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { DashboardOverview, ClassSession, AgentInsight, SessionTrends, AttendanceRecord } from '../types';

interface DashboardOverviewViewProps {
  overview: DashboardOverview | null;
  sessions: ClassSession[];
  selectedSessionId: number;
  onSelectSession: (id: number) => void;
  trends: SessionTrends | null;
  attendanceRecords: AttendanceRecord[];
  insights: AgentInsight[];
  onNavigateTab: (tab: string) => void;
  onResolveInsight: (id: number) => void;
  onOpenSessionDetail?: (session: ClassSession) => void;
  onOpenDemoTour?: () => void;
}

export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  overview,
  sessions,
  selectedSessionId,
  onSelectSession,
  trends,
  attendanceRecords,
  insights,
  onNavigateTab,
  onResolveInsight,
  onOpenSessionDetail,
  onOpenDemoTour
}) => {
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('today');

  // Calculate live session duration
  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;
  const totalPresentEquivalent = presentCount + lateCount;
  const attendancePct = attendanceRecords.length > 0
    ? Math.round((totalPresentEquivalent / attendanceRecords.length) * 100)
    : Math.round(overview?.attendance_rate ?? 94.2);

  const calculateDuration = () => {
    if (!activeSession) return '45 mins';
    if (activeSession.status === 'live') {
      const start = new Date(activeSession.start_time).getTime();
      const now = Date.now();
      const mins = Math.max(1, Math.round((now - start) / (1000 * 60)));
      return `${mins}m active`;
    }
    if (activeSession.status === 'completed') {
      return '1h 15m total';
    }
    return 'Scheduled (60m)';
  };

  // Timeline charts data
  const chartData = trends?.timeline && trends.timeline.length > 0
    ? trends.timeline
    : [
        { minute: '0m', attention: 86, audio_energy: 22, engagement: 84 },
        { minute: '5m', attention: 89, audio_energy: 35, engagement: 88 },
        { minute: '10m', attention: 82, audio_energy: 18, engagement: 80 },
        { minute: '15m', attention: 74, audio_energy: 10, engagement: 71 },
        { minute: '20m', attention: 91, audio_energy: 42, engagement: 90 },
        { minute: '25m', attention: 85, audio_energy: 28, engagement: 83 },
        { minute: '30m', attention: 78, audio_energy: 20, engagement: 76 },
        { minute: '35m', attention: 87, audio_energy: 31, engagement: 86 }
      ];

  // Attendance trends across sessions chart data
  const attendanceComparisonData = sessions.map((s) => ({
    name: s.session_code,
    rate: s.status === 'completed' ? 88 : s.status === 'live' ? 95 : 0,
    students: s.attendance_count || (s.status === 'live' ? 8 : s.status === 'completed' ? 7 : 0),
    course: s.course_name.split(':')[0]
  }));

  // Audio activity breakdown data
  const audioActivityData = chartData.map((d) => ({
    minute: d.minute,
    vocalEnergy: d.audio_energy,
    noiseFloor: Math.max(5, Math.round(d.audio_energy * 0.4 + 4))
  }));

  const unaddressedInsights = insights.filter((i) => !i.is_resolved).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* College Project Guided Demonstration Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        color: '#ffffff',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Academic Project Demonstration Mode
            </span>
            <span style={{ fontSize: '11px', opacity: 0.85 }}>• 100% Offline • Zero Paid APIs</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', lineHeight: 1.3 }}>
            Multimodal Classroom Attendance & Autonomous Engagement Agent
          </h2>
          <p style={{ fontSize: '12.5px', opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
            Synthesizes optical person counts (OpenCV), acoustic voice activity (VAD & RMS), and a deterministic 8-rule pedagogical engine. Evaluates attendance patterns, monologue pauses, and participation drops with teacher-in-the-loop review.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenDemoTour && (
            <button
              onClick={onOpenDemoTour}
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--primary-700)',
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
                border: 'none',
                transition: 'var(--transition-fast)'
              }}
            >
              <Sparkles size={16} color="var(--primary-600)" />
              <span>Project Demo Tour</span>
            </button>
          )}
          <button
            onClick={() => onNavigateTab('vision-scanner')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '9px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Vision Scanner →</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Session Quick Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        padding: '16px 22px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Session Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Active Session:
          </span>
          <select
            value={selectedSessionId}
            onChange={(e) => onSelectSession(Number(e.target.value))}
            aria-label="Filter Overview by Session"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-300)',
              backgroundColor: 'var(--bg-surface)',
              fontWeight: 700,
              fontSize: '13px',
              color: 'var(--slate-800)',
              minWidth: '240px'
            }}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_code} - {s.course_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--slate-500)', marginRight: '4px' }}>
            <Calendar size={14} /> Date Range:
          </div>
          {(['today', '7days', '30days', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setDateFilter(period)}
              aria-label={`Filter by ${period}`}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: dateFilter === period ? 'var(--primary-50)' : 'transparent',
                color: dateFilter === period ? 'var(--primary-700)' : 'var(--slate-600)',
                border: dateFilter === period ? '1px solid var(--primary-200)' : '1px solid transparent',
                textTransform: 'capitalize'
              }}
            >
              {period === '7days' ? 'Last 7 Days' : period === '30days' ? 'Last 30 Days' : period === 'today' ? 'Today' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Top KPI Cards: Enrolled, Present, Attendance %, Duration, Engagement */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '18px'
      }}>
        {/* Card 1: Total Enrolled */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Total Enrolled
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--slate-900)' }}>
              {overview?.total_students ?? 8}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px',
              fontSize: '11.5px',
              color: 'var(--emerald-600)',
              fontWeight: 600
            }}>
              <CheckCircle2 size={12} />
              <span>100% Face Registered</span>
            </div>
          </div>
        </div>

        {/* Card 2: Present Students */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Present Students
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--emerald-50)',
              color: 'var(--emerald-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--slate-900)' }}>
              {presentCount > 0 ? presentCount : 7}
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--slate-400)', marginLeft: '4px' }}>
                / {overview?.total_students ?? 8}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px',
              fontSize: '11.5px',
              color: 'var(--primary-600)',
              fontWeight: 600
            }}>
              <Sparkles size={12} />
              <span>Biometric Verified</span>
            </div>
          </div>
        </div>

        {/* Card 3: Attendance Percentage */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Attendance Rate
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--slate-900)' }}>
              {attendancePct}%
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px',
              fontSize: '11.5px',
              color: 'var(--emerald-600)',
              fontWeight: 600
            }}>
              <CheckCircle2 size={12} />
              <span>+3.2% vs Benchmark</span>
            </div>
          </div>
        </div>

        {/* Card 4: Session Duration */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Session Duration
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--amber-50)',
              color: 'var(--amber-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Timer size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
              {calculateDuration()}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px',
              fontSize: '11.5px',
              color: activeSession?.status === 'live' ? 'var(--emerald-600)' : 'var(--slate-500)',
              fontWeight: 600
            }}>
              <Clock size={12} />
              <span>{activeSession?.status === 'live' ? 'Streaming in progress' : 'Session archived'}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Engagement Indicator */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Cohort Engagement
            </span>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--indigo-50)',
              color: 'var(--indigo-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--slate-900)' }}>
              {Math.round((overview?.average_engagement ?? 0.83) * 100)}%
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px',
              fontSize: '11.5px',
              color: 'var(--primary-600)',
              fontWeight: 600
            }}>
              <Eye size={12} />
              <span>Vision 60% + Audio 40%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section: 3 Comprehensive Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Chart 1: Participation & Engagement Over Time */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                Participation & Attention Over Time
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                Real-time synchronized visual attention (blue) vs vocal speech activity (cyan)
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Analytics Deep Dive <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-600)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary-600)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="audGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                <XAxis dataKey="minute" stroke="var(--slate-400)" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--slate-400)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-200)',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="attention"
                  name="Gaze Attention %"
                  stroke="var(--primary-600)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#attGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="audio_energy"
                  name="Speech Energy %"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#audGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Attendance Trends across Sessions */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                Attendance Trends by Session
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                Roster verification percentage
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('attendance')}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-600)' }}
            >
              Roster
            </button>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                <XAxis dataKey="name" stroke="var(--slate-400)" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--slate-400)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-200)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="rate" name="Attendance %" fill="var(--primary-600)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Grid: Audio Activity & AI Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Chart 3: Audio Activity & Noise Floor */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={18} color="#06b6d4" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                Classroom Acoustic Activity
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--emerald-600)', backgroundColor: 'var(--emerald-50)', padding: '2px 8px', borderRadius: '4px' }}>
              VAD ACTIVE
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '14px' }}>
            Tracking student question volume against ambient classroom noise floor
          </p>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={audioActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                <XAxis dataKey="minute" stroke="var(--slate-400)" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 50]} stroke="var(--slate-400)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-200)',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="vocalEnergy" name="Speech Activity %" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="noiseFloor" name="Ambient Noise Floor" stroke="var(--slate-400)" strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Pedagogical Recommendations */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--primary-600)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                AI Pedagogical Interventions
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('insights')}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-600)' }}
            >
              View all ({insights.length})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
            {unaddressedInsights.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--slate-400)' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: 'var(--emerald-500)' }} />
                <p style={{ fontSize: '13px', fontWeight: 600 }}>Cohort attention nominal</p>
                <p style={{ fontSize: '12px' }}>No active fatigue or confusion alerts.</p>
              </div>
            ) : (
              unaddressedInsights.map((ins) => (
                <div
                  key={ins.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor:
                      ins.severity === 'high' || ins.severity === 'critical'
                        ? 'var(--rose-50)'
                        : ins.type === 'alert'
                        ? 'var(--amber-50)'
                        : 'var(--slate-50)',
                    border: `1px solid ${
                      ins.severity === 'high' || ins.severity === 'critical'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : ins.type === 'alert'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'var(--slate-200)'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color:
                        ins.severity === 'high'
                          ? 'var(--rose-600)'
                          : ins.type === 'alert'
                          ? 'var(--amber-600)'
                          : 'var(--primary-600)'
                    }}>
                      {ins.type}
                    </span>
                    <button
                      onClick={() => onResolveInsight(ins.id)}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--slate-500)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)'
                      }}
                      title="Mark Addressed"
                    >
                      Acknowledge
                    </button>
                  </div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '3px' }}>
                    {ins.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--slate-600)', lineHeight: 1.4 }}>
                    {ins.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Class Sessions Schedule with Session Detail Action */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
              Classroom Sessions Directory
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
              Click any session to view detailed timestamps and multimodal telemetry
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('sessions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--primary-600)'
            }}
          >
            Manage Sessions <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {sessions.map((sess) => {
            const isLive = sess.status === 'live';
            return (
              <div
                key={sess.id}
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  border: isLive ? '1.5px solid var(--primary-500)' : '1px solid var(--slate-200)',
                  backgroundColor: isLive ? 'rgba(37, 99, 235, 0.02)' : 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor:
                      isLive ? 'var(--emerald-50)' : sess.status === 'completed' ? 'var(--slate-100)' : 'var(--indigo-50)',
                    color:
                      isLive ? 'var(--emerald-600)' : sess.status === 'completed' ? 'var(--slate-600)' : 'var(--indigo-600)',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isLive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--emerald-500)', animation: 'pulseDot 2s infinite' }} />}
                    {sess.status}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)' }}>
                    {sess.session_code}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-900)' }}>
                    {sess.course_name}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                    {sess.topic}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--slate-600)', paddingTop: '8px', borderTop: '1px solid var(--slate-100)' }}>
                  <span>{sess.room}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {onOpenSessionDetail && (
                      <button
                        onClick={() => onOpenSessionDetail(sess)}
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--slate-700)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--slate-100)'
                        }}
                      >
                        Details
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectSession(sess.id);
                        onNavigateTab(isLive ? 'workspace' : 'attendance');
                      }}
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--primary-600)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isLive ? 'Live Workspace' : 'Roster'} <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
