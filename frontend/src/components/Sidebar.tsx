import React from 'react';
import {
  LayoutDashboard,
  Video,
  ClipboardCheck,
  BarChart3,
  Sparkles,
  Users,
  Calendar,
  Activity,
  CheckCircle2,
  Server,
  Settings,
  Camera,
  Volume2,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeSessionTitle?: string;
  alertsCount?: number;
  onOpenDemoTour?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  activeSessionTitle,
  alertsCount = 0,
  onOpenDemoTour
}) => {
  const mainNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'workspace', label: 'Workspace', icon: Video, badge: 'LIVE' },
    { id: 'sessions', label: 'Sessions', icon: Calendar },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'vision-scanner', label: 'Vision Scanner', icon: Camera, badge: 'CV' },
    { id: 'audio-intelligence', label: 'Audio Intelligence', icon: Volume2, badge: 'VAD' },
    { id: 'analytics', label: 'Engagement Analytics', icon: BarChart3 },
    { id: 'insights', label: 'AI Recommendations', icon: Sparkles, count: alertsCount },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const secondaryNavItems = [
    { id: 'students', label: 'Student Directory', icon: Users }
  ];

  return (
    <aside
      aria-label="Sidebar Navigation"
      style={{
        width: '270px',
        minWidth: '270px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--slate-200)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--slate-200)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: 'var(--shadow-blue)'
        }}>
          <Activity size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Multimodal AI
          </h2>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Attendance & Engagement
          </p>
        </div>
      </div>

      {/* Live Class Indicator Banner */}
      {activeSessionTitle && (
        <div style={{
          margin: '16px 16px 8px 16px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'var(--emerald-500)',
            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
            animation: 'pulseDot 2s infinite'
          }} />
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase' }}>
              Live Stream Active
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--slate-700)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {activeSessionTitle}
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Items */}
      <nav aria-label="Main Navigation" style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        <div style={{ padding: '0 10px 6px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Platform
        </div>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                color: isActive ? 'var(--primary-700)' : 'var(--slate-600)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                transition: 'var(--transition-fast)',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--slate-100)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={18} color={isActive ? 'var(--primary-600)' : 'var(--slate-500)'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              
              {item.badge && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--rose-500)',
                  color: '#ffffff',
                  letterSpacing: '0.04em'
                }}>
                  {item.badge}
                </span>
              )}

              {Boolean(item.count && item.count > 0) && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-600)',
                  color: '#ffffff'
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ padding: '16px 10px 6px 10px', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Directory
        </div>
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                color: isActive ? 'var(--primary-700)' : 'var(--slate-600)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                transition: 'var(--transition-fast)',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--slate-100)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon size={18} color={isActive ? 'var(--primary-600)' : 'var(--slate-500)'} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* College Project Presentation Tour CTA */}
      {onOpenDemoTour && (
        <div style={{ padding: '0 16px 14px 16px' }}>
          <button
            onClick={onOpenDemoTour}
            aria-label="Launch College Project Demo Tour"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary-50) 0%, #eff6ff 100%)',
              border: '1px solid var(--primary-200)',
              color: 'var(--primary-800)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: 'var(--shadow-xs)',
              transition: 'var(--transition-fast)'
            }}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <GraduationCap size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800 }}>Project Demo Tour</div>
              <div style={{ fontSize: '10.5px', color: 'var(--primary-600)' }}>Guided College Showcase</div>
            </div>
          </button>
        </div>
      )}

      {/* System Status Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--slate-200)',
        backgroundColor: 'var(--slate-50)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={14} color="var(--slate-500)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>Local Backend</span>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--emerald-600)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <CheckCircle2 size={12} /> Ready
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
          SQLite Engine • Multimodal v1.0
        </p>
      </div>
    </aside>
  );
};
