import React, { useState, useEffect } from 'react';
import {
  Clock,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Check,
  X,
  Info
} from 'lucide-react';
import type {
  ClassSession,
  RecommendationItem,
  SessionSummaryResponse,
  ReasoningRuleDocumentation
} from '../types';
import { api } from '../services/api';

interface InsightsViewProps {
  sessions: ClassSession[];
  selectedSessionId: number;
  onSelectSession: (id: number) => void;
  insights?: any[];
  onRefreshInsights?: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  onRefreshInsights
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [summary, setSummary] = useState<SessionSummaryResponse | null>(null);
  const [rulesCatalog, setRulesCatalog] = useState<ReasoningRuleDocumentation[]>([]);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [feedbackInputId, setFeedbackInputId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch session recommendations & rule documentation
  useEffect(() => {
    loadRecommendations(selectedSessionId);
    loadRulesCatalog();
  }, [selectedSessionId]);

  const loadRecommendations = async (sessionId: number) => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setActionError(null);
      const data = await api.getSessionRecommendations(sessionId);
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      console.warn('Could not load session recommendations:', err);
      setActionError('Failed to fetch recommendations for this session.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRulesCatalog = async () => {
    try {
      const rules = await api.getReasoningRules();
      setRulesCatalog(rules);
    } catch (err) {
      console.warn('Could not load rules catalog:', err);
    }
  };

  const handleReevaluateRules = async () => {
    try {
      setIsGenerating(true);
      setActionError(null);
      const data = await api.generateRecommendations(selectedSessionId);
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || null);
      if (onRefreshInsights) {
        onRefreshInsights();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to re-evaluate reasoning rules.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async (recId: number) => {
    try {
      const updated = await api.applyRecommendation(recId, feedbackText || 'Implemented during instructional delivery');
      setRecommendations((prev) => prev.map((r) => (r.id === recId ? updated : r)));
      setFeedbackInputId(null);
      setFeedbackText('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to apply recommendation.');
    }
  };

  const handleDismiss = async (recId: number) => {
    try {
      const updated = await api.dismissRecommendation(recId, feedbackText || 'Deliberate instructional choice');
      setRecommendations((prev) => prev.map((r) => (r.id === recId ? updated : r)));
      setFeedbackInputId(null);
      setFeedbackText('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to dismiss recommendation.');
    }
  };

  const filteredItems = recommendations.filter((item) => {
    if (filterType === 'all') return true;
    return item.item_type === filterType;
  });

  const obsCount = recommendations.filter((r) => r.item_type === 'OBSERVED_MEASUREMENT').length;
  const estCount = recommendations.filter((r) => r.item_type === 'STATISTICAL_ESTIMATE').length;
  const pedCount = recommendations.filter((r) => r.item_type === 'PEDAGOGICAL_RECOMMENDATION').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Epistemological Integrity Notice Banner */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '820px' }}>
          <div style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-600)',
            marginTop: '2px'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Transparent Pedagogical Rule Engine & Analytics Agent
              </h2>
              <span style={{
                backgroundColor: 'var(--emerald-50)',
                color: 'var(--emerald-700)',
                border: '1px solid var(--emerald-200)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}>
                100% Offline Rules
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '4px', lineHeight: 1.5, margin: 0 }}>
              Deterministic synthesis of attendance logs, spatial headcount, speech pacing, and silence intervals.
              Zero cloud LLMs or third-party inference.
            </p>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '6px', margin: 0, fontStyle: 'italic' }}>
              Ethical Standard: Attention, emotion, and comprehension are internal cognitive states and are NEVER presented as directly detected facts.
            </p>
          </div>
        </div>

        {/* Rule Catalog Modal CTA & Re-evaluate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowRulesModal(!showRulesModal)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-300)',
              backgroundColor: 'var(--slate-50)',
              color: 'var(--slate-700)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Sliders size={14} /> View 8 Reasoning Rules
          </button>
          <button
            onClick={handleReevaluateRules}
            disabled={isGenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-blue)'
            }}
          >
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            {isGenerating ? 'Evaluating Rules...' : 'Re-evaluate Telemetry'}
          </button>
        </div>
      </div>

      {/* Rules Catalog Modal */}
      {showRulesModal && (
        <div style={{
          backgroundColor: 'var(--slate-900)',
          color: '#e2e8f0',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Transparent Rule-Based Reasoning Engine Catalog
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                All recommendations are derived deterministically using the following codified educational heuristics.
              </p>
            </div>
            <button
              onClick={() => setShowRulesModal(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
            >
              Close
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {rulesCatalog.map((rule) => (
              <div
                key={rule.rule_id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  border: '1px solid #334155',
                  fontSize: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#38bdf8' }}>{rule.rule_name}</strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>{rule.category}</span>
                </div>
                <div style={{ color: '#f1f5f9' }}>
                  <span style={{ color: '#94a3b8' }}>Trigger: </span>
                  <code>{rule.trigger_condition}</code>
                </div>
                <div style={{ color: '#cbd5e1' }}>
                  <span style={{ color: '#94a3b8' }}>Action: </span>
                  {rule.suggested_action}
                </div>
                <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                  Rationale: {rule.pedagogical_rationale}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Selector & Active Modality Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        padding: '18px 24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-700)' }}>
            Select Class Session:
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => onSelectSession(Number(e.target.value))}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--slate-300)',
              fontSize: '13px',
              backgroundColor: '#ffffff',
              minWidth: '280px'
            }}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.session_code} - {s.course_name} ({s.status})
              </option>
            ))}
          </select>
        </div>

        {/* Modality Health Badges */}
        {summary && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 600 }}>Modality Health:</span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--emerald-50)',
              color: 'var(--emerald-700)',
              border: '1px solid var(--emerald-200)'
            }}>
              Attendance: Verified ({summary.confirmed_attendance_count}/{summary.enrolled_student_count})
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: summary.active_modalities.includes('vision') ? 'var(--emerald-50)' : 'var(--slate-100)',
              color: summary.active_modalities.includes('vision') ? 'var(--emerald-700)' : 'var(--slate-500)',
              border: '1px solid var(--slate-200)'
            }}>
              Vision: {summary.active_modalities.includes('vision') ? 'Active' : 'Offline'}
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: summary.active_modalities.includes('audio') ? 'var(--emerald-50)' : 'var(--slate-100)',
              color: summary.active_modalities.includes('audio') ? 'var(--emerald-700)' : 'var(--slate-500)',
              border: '1px solid var(--slate-200)'
            }}>
              Audio: {summary.active_modalities.includes('audio') ? 'Active' : 'Disabled / Offline'}
            </span>
            {summary.attendance_change_from_prior !== null && summary.attendance_change_from_prior !== undefined && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: summary.attendance_change_from_prior >= 0 ? 'var(--emerald-50)' : 'var(--rose-50)',
                color: summary.attendance_change_from_prior >= 0 ? 'var(--emerald-700)' : 'var(--rose-700)',
                border: `1px solid ${summary.attendance_change_from_prior >= 0 ? 'var(--emerald-200)' : 'var(--rose-200)'}`
              }}>
                Trend: {summary.attendance_change_from_prior >= 0 ? '+' : ''}{summary.attendance_change_from_prior}% vs Prior
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs by Epistemological Type */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setFilterType('all')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: filterType === 'all' ? 'var(--primary-600)' : '#ffffff',
            color: filterType === 'all' ? '#ffffff' : 'var(--slate-700)',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          All Items ({recommendations.length})
        </button>
        <button
          onClick={() => setFilterType('PEDAGOGICAL_RECOMMENDATION')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: filterType === 'PEDAGOGICAL_RECOMMENDATION' ? 'var(--amber-600)' : '#ffffff',
            color: filterType === 'PEDAGOGICAL_RECOMMENDATION' ? '#ffffff' : 'var(--amber-800)',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          Pedagogical Suggestions ({pedCount})
        </button>
        <button
          onClick={() => setFilterType('OBSERVED_MEASUREMENT')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: filterType === 'OBSERVED_MEASUREMENT' ? 'var(--primary-700)' : '#ffffff',
            color: filterType === 'OBSERVED_MEASUREMENT' ? '#ffffff' : 'var(--primary-800)',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          Observed Measurements ({obsCount})
        </button>
        <button
          onClick={() => setFilterType('STATISTICAL_ESTIMATE')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: filterType === 'STATISTICAL_ESTIMATE' ? '#6366f1' : '#ffffff',
            color: filterType === 'STATISTICAL_ESTIMATE' ? '#ffffff' : '#4338ca',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          Statistical Estimates ({estCount})
        </button>
      </div>

      {actionError && (
        <div style={{
          backgroundColor: 'var(--rose-50)',
          color: 'var(--rose-700)',
          border: '1px solid var(--rose-200)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px'
        }}>
          {actionError}
        </div>
      )}

      {/* Main Recommendations / Observations Deck */}
      {isLoading ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--slate-500)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <RefreshCw size={24} className="animate-spin" />
          <span>Evaluating multimodal reasoning rules for session...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{
          padding: '50px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--slate-500)'
        }}>
          No items found matching the selected filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredItems.map((item) => {
            const isRec = item.item_type === 'PEDAGOGICAL_RECOMMENDATION';
            const isMeas = item.item_type === 'OBSERVED_MEASUREMENT';

            let typeBadgeBg = '#e0e7ff';
            let typeBadgeColor = '#3730a3';
            let typeLabel = 'STATISTICAL ESTIMATE';

            if (isRec) {
              typeBadgeBg = 'var(--amber-100)';
              typeBadgeColor = 'var(--amber-800)';
              typeLabel = 'PEDAGOGICAL SUGGESTION';
            } else if (isMeas) {
              typeBadgeBg = 'var(--primary-100)';
              typeBadgeColor = 'var(--primary-800)';
              typeLabel = 'OBSERVED MEASUREMENT';
            }

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: item.is_applied ? '2px solid var(--emerald-400)' : '1px solid var(--slate-200)',
                  padding: '22px 24px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  transition: 'border-color 0.2s'
                }}
              >
                {/* Card Header: Type, Title, Severity, Timestamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      backgroundColor: typeBadgeBg,
                      color: typeBadgeColor,
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em'
                    }}>
                      {typeLabel}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--slate-500)',
                      textTransform: 'uppercase'
                    }}>
                      {item.category}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                      {item.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.is_applied && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'var(--emerald-50)',
                        color: 'var(--emerald-700)',
                        border: '1px solid var(--emerald-300)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        <Check size={12} /> Applied by Teacher
                      </span>
                    )}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: item.severity === 'high' ? 'var(--rose-100)' : item.severity === 'medium' ? 'var(--amber-100)' : 'var(--slate-100)',
                      color: item.severity === 'high' ? 'var(--rose-800)' : item.severity === 'medium' ? 'var(--amber-800)' : 'var(--slate-700)',
                      textTransform: 'uppercase'
                    }}>
                      {item.severity} severity
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Suggestion & Pedagogical Rationale */}
                <div style={{ fontSize: '14px', color: 'var(--slate-800)', lineHeight: 1.6 }}>
                  {item.suggestion}
                </div>

                {item.pedagogical_rationale && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--slate-600)',
                    backgroundColor: 'var(--slate-50)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--primary-600)'
                  }}>
                    <strong>Pedagogical Rationale:</strong> {item.pedagogical_rationale}
                  </div>
                )}

                {/* Supporting Signals List */}
                {item.supporting_signals && item.supporting_signals.length > 0 && (
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', display: 'block', marginBottom: '6px' }}>
                      SUPPORTING MEASURED SIGNALS:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {item.supporting_signals.map((sig, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            backgroundColor: 'var(--slate-100)',
                            color: 'var(--slate-700)',
                            border: '1px solid var(--slate-200)'
                          }}
                        >
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confidence & Epistemological Sensor Limitation */}
                <div style={{
                  fontSize: '11px',
                  color: 'var(--slate-500)',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Info size={14} color="var(--slate-400)" />
                  <span>
                    <strong>Sensor Limitations:</strong> {item.confidence_limitations} (Engine Confidence: {Math.round(item.confidence_score * 100)}%)
                  </span>
                </div>

                {/* Teacher Feedback / Action Buttons */}
                {isRec && (
                  <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {feedbackInputId === item.id ? (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <input
                          type="text"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Optional teacher review notes..."
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--slate-300)',
                            fontSize: '12px'
                          }}
                        />
                        <button
                          onClick={() => handleApply(item.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--emerald-600)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Confirm Applied
                        </button>
                        <button
                          onClick={() => handleDismiss(item.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--slate-200)',
                            color: 'var(--slate-700)',
                            border: 'none',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setFeedbackInputId(item.id);
                            setFeedbackText('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--emerald-300)',
                            backgroundColor: 'var(--emerald-50)',
                            color: 'var(--emerald-700)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Check size={13} /> Mark as Applied in Class
                        </button>
                        <button
                          onClick={() => handleDismiss(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--slate-300)',
                            backgroundColor: 'var(--slate-50)',
                            color: 'var(--slate-600)',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          <X size={13} /> Dismiss
                        </button>
                      </div>
                    )}

                    {item.teacher_feedback && (
                      <span style={{ fontSize: '11px', color: 'var(--slate-600)', fontStyle: 'italic' }}>
                        Note: {item.teacher_feedback}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
