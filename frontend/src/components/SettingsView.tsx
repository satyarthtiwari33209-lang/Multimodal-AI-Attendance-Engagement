import React, { useState } from 'react';
import {
  Settings,
  Database,
  Sliders,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Save
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsViewProps {
  onRefreshAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshAllData }) => {
  // Threshold settings state
  const [attentionThreshold, setAttentionThreshold] = useState<number>(0.60);
  const [drowsinessEarThreshold, setDrowsinessEarThreshold] = useState<number>(0.22);
  const [speechVadThreshold, setSpeechVadThreshold] = useState<number>(0.08);
  const [visionWeight, setVisionWeight] = useState<number>(0.60);
  const [audioWeight, setAudioWeight] = useState<number>(0.40);

  // Server state
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000');
  const [isTestingHealth, setIsTestingHealth] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  // Re-seeding state
  const [isReseeding, setIsReseeding] = useState<boolean>(false);
  const [reseedMessage, setReseedMessage] = useState<string | null>(null);

  // Save feedback
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleTestConnection = async () => {
    setIsTestingHealth(true);
    setHealthStatus(null);
    try {
      const res = await api.getHealth();
      setHealthStatus(`Connected! Status: ${res.status}, Enrolled: ${res.enrolled_students} students, DB: ${res.database}`);
    } catch (err: any) {
      setHealthStatus(`Connection failed: ${err.message}`);
    } finally {
      setIsTestingHealth(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Are you sure you want to re-seed the demo database? This will restore pristine synthetic records.')) {
      return;
    }
    setIsReseeding(true);
    setReseedMessage(null);
    try {
      const res = await api.resetDemoData();
      setReseedMessage(res.message);
      onRefreshAllData();
      setTimeout(() => setReseedMessage(null), 4000);
    } catch (err: any) {
      setReseedMessage(`Reset failed: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '980px' }}>
      {/* Page Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} color="var(--primary-600)" />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>
              Agent Configuration & System Settings
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Configure perception thresholds, multimodal fusion weights, and database management
          </p>
        </div>

        {savedSuccess && (
          <span style={{
            fontSize: '12.5px',
            fontWeight: 700,
            color: 'var(--emerald-700)',
            backgroundColor: 'var(--emerald-50)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <CheckCircle2 size={15} /> Settings Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Perception & Agent Thresholds */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sliders size={18} color="var(--primary-600)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
              Perception & Agent Thresholds
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Attention Threshold */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Visual Attention Cutoff
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-600)' }}>
                  {Math.round(attentionThreshold * 100)}%
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-500)', margin: '4px 0 10px 0' }}>
                Frames with gaze score below this value trigger distraction flags.
              </p>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.05"
                value={attentionThreshold}
                onChange={(e) => setAttentionThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary-600)' }}
              />
            </div>

            {/* Drowsiness EAR Threshold */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Drowsiness Eye Aspect Ratio (EAR)
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--rose-600)' }}>
                  {drowsinessEarThreshold.toFixed(2)}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-500)', margin: '4px 0 10px 0' }}>
                Eye opening ratio below this value triggers immediate fatigue interventions.
              </p>
              <input
                type="range"
                min="0.15"
                max="0.30"
                step="0.01"
                value={drowsinessEarThreshold}
                onChange={(e) => setDrowsinessEarThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--rose-600)' }}
              />
            </div>

            {/* Audio VAD Threshold */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Audio Speech Activity (VAD)
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0891b2' }}>
                  {speechVadThreshold.toFixed(2)} RMS
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-500)', margin: '4px 0 10px 0' }}>
                Microphone volume level identifying active student dialogue vs silence.
              </p>
              <input
                type="range"
                min="0.02"
                max="0.25"
                step="0.01"
                value={speechVadThreshold}
                onChange={(e) => setSpeechVadThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0891b2' }}
              />
            </div>

            {/* Multimodal Fusion Weights */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Fusion Weights (Vision : Audio)
                </label>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--indigo-600)' }}>
                  {Math.round(visionWeight * 100)}% : {Math.round(audioWeight * 100)}%
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-500)', margin: '4px 0 10px 0' }}>
                Balanced multimodal weight distribution for class engagement calculation.
              </p>
              <input
                type="range"
                min="0.3"
                max="0.8"
                step="0.05"
                value={visionWeight}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVisionWeight(v);
                  setAudioWeight(Number((1 - v).toFixed(2)));
                }}
                style={{ width: '100%', accentColor: 'var(--indigo-600)' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Backend API & Service Health */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Server size={18} color="var(--primary-600)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
              Backend API & Connection
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                FastAPI Host URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-300)',
                  fontSize: '13px',
                  color: 'var(--slate-800)'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingHealth}
              style={{
                marginTop: '20px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--slate-300)',
                backgroundColor: 'var(--slate-50)',
                color: 'var(--slate-800)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isTestingHealth ? <RefreshCw size={14} className="animate-spin" /> : <Server size={14} />}
              <span>Test Connection</span>
            </button>
          </div>

          {healthStatus && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: healthStatus.startsWith('Connected') ? 'var(--emerald-50)' : 'var(--rose-50)',
              color: healthStatus.startsWith('Connected') ? 'var(--emerald-800)' : 'var(--rose-800)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {healthStatus.startsWith('Connected') ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              <span>{healthStatus}</span>
            </div>
          )}
        </div>

        {/* Section 3: Demo Dataset Management */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#b45309" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                Demo Dataset Administration
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e' }}>
              ACTIVE SEED DATA
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--slate-600)', lineHeight: 1.45, marginBottom: '16px' }}>
            The current database is pre-seeded with 8 synthetic students, 3 class sessions, biometric embeddings, and time-series telemetry. You can re-initialize the SQLite database at any time.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleResetDemoData}
              disabled={isReseeding}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#b45309',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              {isReseeding ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Reset & Re-seed Demo Data</span>
            </button>
          </div>

          {reseedMessage && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--emerald-50)',
              color: 'var(--emerald-800)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={14} />
              <span>{reseedMessage}</span>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '13.5px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Save size={16} /> Save Threshold Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
