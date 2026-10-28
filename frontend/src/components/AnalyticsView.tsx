import React from 'react';
import {
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
import {
  Zap,
  CheckCircle,
  Mic,
  Brain
} from 'lucide-react';
import type { SessionTrends, StudentLeaderboardItem } from '../types';

interface AnalyticsViewProps {
  trends: SessionTrends | null;
  leaderboard: StudentLeaderboardItem[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  trends,
  leaderboard
}) => {
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

  const emotionData = [
    { emotion: 'Focused', count: 68, fill: 'var(--primary-600)' },
    { emotion: 'Neutral', count: 20, fill: 'var(--slate-400)' },
    { emotion: 'Confused', count: 8, fill: 'var(--amber-500)' },
    { emotion: 'Distracted', count: 4, fill: 'var(--rose-500)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Insights Callouts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Brain size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Optimal Focus Window
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>
              Minutes 15 to 25
            </div>
            <div style={{ fontSize: '11px', color: 'var(--emerald-600)', fontWeight: 600 }}>
              Peak visual retention at 91%
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--emerald-50)',
            color: 'var(--emerald-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Mic size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Acoustic Dialogue Ratio
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>
              28.4% Vocal Activity
            </div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
              Active student Q&A and collaboration
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--amber-50)',
            color: 'var(--amber-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Cognitive Friction Moments
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>
              Minute 18 (Proof Section)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--amber-600)', fontWeight: 600 }}>
              Saccadic confusion detected
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts: Engagement Curves + Emotion Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Multimodal Timeline Area Chart */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
              Timeline Multimodal Correlation
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
              Tracking synchronized attention (blue line), acoustic activity (cyan line), and overall fused engagement
            </p>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                <XAxis dataKey="minute" stroke="var(--slate-400)" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="var(--slate-400)" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--slate-200)',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="attention"
                  name="Gaze Attention %"
                  stroke="var(--primary-600)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="audio_energy"
                  name="Speech Energy %"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  name="Fused Score %"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotion Distribution Bar Chart */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
              Facial Affect Distribution
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
              Aggregated facial cue classification
            </p>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--slate-200)" />
                <XAxis type="number" stroke="var(--slate-400)" fontSize={12} tickLine={false} />
                <YAxis dataKey="emotion" type="category" stroke="var(--slate-600)" fontSize={12} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Frequency %" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Student Engagement Leaderboard Table */}
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
              Student Engagement & Attendance Leaderboard
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
              Individual student analytics ranked by multimodal focus index
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)' }}>
            Showing Top {leaderboard.length} Students
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)', color: 'var(--slate-500)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Rank</th>
                <th style={{ padding: '12px 20px' }}>Student</th>
                <th style={{ padding: '12px 16px' }}>Student ID</th>
                <th style={{ padding: '12px 16px' }}>Department</th>
                <th style={{ padding: '12px 16px' }}>Attendance Rate</th>
                <th style={{ padding: '12px 16px' }}>Engagement Score</th>
                <th style={{ padding: '12px 16px' }}>Biometric Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((stu, index) => (
                <tr
                  key={stu.id}
                  style={{ borderBottom: '1px solid var(--slate-100)' }}
                >
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: index < 3 ? 'var(--primary-600)' : 'var(--slate-400)' }}>
                    #{index + 1}
                  </td>
                  <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={stu.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stu.student_id}`}
                      alt={stu.name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{stu.name}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--slate-600)', fontFamily: 'monospace' }}>
                    {stu.student_id}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--slate-600)' }}>
                    {stu.department}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--emerald-600)' }}>
                      {stu.attendance_rate}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', borderRadius: '3px', backgroundColor: 'var(--slate-200)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.round(stu.engagement_score)}%`,
                          height: '100%',
                          backgroundColor: 'var(--primary-600)'
                        }} />
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                        {stu.engagement_score}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--emerald-50)',
                      color: 'var(--emerald-700)',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      <CheckCircle size={12} /> Registered
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
