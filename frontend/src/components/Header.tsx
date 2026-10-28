import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle,
  Database,
  Info,
  Calendar,
  GraduationCap
} from 'lucide-react';
import type { ClassSession } from '../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onQuickSimulate: () => void;
  isSimulating: boolean;
  sessions: ClassSession[];
  selectedSessionId: number;
  onSelectSession: (id: number) => void;
  onNavigateTab: (tab: string) => void;
  alertsCount?: number;
  onOpenDemoTour?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onQuickSimulate,
  isSimulating,
  sessions,
  selectedSessionId,
  onSelectSession,
  onNavigateTab,
  onOpenDemoTour
}) => {
  const [pulseSuccess, setPulseSuccess] = useState(false);
  const [showDemoInfo, setShowDemoInfo] = useState(false);

  const handlePulse = async () => {
    onQuickSimulate();
    setPulseSuccess(true);
    setTimeout(() => setPulseSuccess(false), 2500);
  };

  return (
    <header
      role="banner"
      style={{
        height: '70px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--slate-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
    >
      {/* Title & Context */}
      <div>
        <h1 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* College Project Demo Tour Button */}
        {onOpenDemoTour && (
          <button
            onClick={onOpenDemoTour}
            aria-label="Launch College Project Demo Tour"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              color: 'var(--primary-700)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--transition-fast)'
            }}
            title="Launch interactive college project presentation walkthrough"
          >
            <GraduationCap size={15} color="var(--primary-600)" />
            <span>Project Demo Tour</span>
          </button>
        )}

        {/* Clearly Visible Demo Data Indicator */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDemoInfo(!showDemoInfo)}
            aria-label="Demo Dataset Information"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#b45309',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.03em'
            }}
          >
            <Database size={13} />
            <span>DEMO DATA ACTIVE</span>
            <Info size={12} />
          </button>

          {showDemoInfo && (
            <div
              style={{
                position: 'absolute',
                top: '36px',
                right: 0,
                width: '280px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '14px',
                zIndex: 60,
                fontSize: '12px',
                color: 'var(--slate-700)',
                lineHeight: 1.45
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} color="#b45309" /> Realistic Synthetic Dataset
              </div>
              <p>
                All student rosters, 32-dimensional biometric templates, and 35-minute time-series curves are synthetic demo models.
              </p>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>SQLite persistent engine</span>
                <button
                  onClick={() => {
                    setShowDemoInfo(false);
                    onNavigateTab('settings');
                  }}
                  style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary-600)' }}
                >
                  Manage in Settings →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Active Session Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={15} color="var(--slate-400)" />
          <select
            value={selectedSessionId}
            onChange={(e) => onSelectSession(Number(e.target.value))}
            aria-label="Active Class Session"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)',
              backgroundColor: 'var(--slate-50)',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--slate-800)',
              maxWidth: '220px'
            }}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_code} {s.status === 'live' ? '● LIVE' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Ingest Button */}
        <button
          onClick={handlePulse}
          disabled={isSimulating}
          aria-label="Ingest Multimodal Pulse"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: pulseSuccess ? 'var(--emerald-500)' : 'var(--primary-600)',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12.5px',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
            transition: 'var(--transition-fast)'
          }}
          title="Send a sample multimodal frame & audio to FastAPI"
        >
          {pulseSuccess ? (
            <>
              <CheckCircle size={15} />
              <span>Ingested!</span>
            </>
          ) : isSimulating ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Ingesting...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} />
              <span>Trigger Pulse</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '26px', backgroundColor: 'var(--slate-200)' }} />

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"
            alt="Instructor Dr. Robert Vance"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid var(--primary-100)',
              objectFit: 'cover'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.2 }}>
              Dr. Robert Vance
            </span>
            <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
              Instructor
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
