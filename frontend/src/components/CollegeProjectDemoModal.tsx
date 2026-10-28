import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Camera,
  Volume2,
  BarChart3,
  Lightbulb,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  Lock
} from 'lucide-react';

interface CollegeProjectDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const CollegeProjectDemoModal: React.FC<CollegeProjectDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const demoSteps = [
    {
      id: 'abstract',
      title: '1. Project Overview & Architecture',
      subtitle: 'Multimodal Sensor Telemetry + Transparent Deterministic AI Engine',
      icon: Layers,
      badgeColor: '#2563eb',
      badgeBg: '#eff6ff',
      targetTab: 'overview',
      targetLabel: 'Explore Dashboard Overview',
      content: (
        <div>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: 1.6, marginBottom: '14px' }}>
            The <strong>Multimodal Attendance & Engagement Agent</strong> is a full-stack education analytics platform that bridges physical classroom dynamics with actionable instructional coaching. It solves the limitations of traditional manual roll calls and opaque cloud AI by combining local computer vision, acoustic signal processing, and a deterministic pedagogical rule engine.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--slate-900)', fontSize: '12.5px', marginBottom: '4px' }}>
                <Cpu size={14} color="var(--primary-600)" /> 100% Offline
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-600)', margin: 0 }}>
                Runs completely locally using Python FastAPI, OpenCV, and NumPy with zero paid cloud APIs or external LLM tokens.
              </p>
            </div>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--slate-900)', fontSize: '12.5px', marginBottom: '4px' }}>
                <Database size={14} color="#059669" /> Persistent SQLite
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-600)', margin: 0 }}>
                Stores student records, session state, attendance logs, and pedagogical recommendations persistently.
              </p>
            </div>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--slate-900)', fontSize: '12.5px', marginBottom: '4px' }}>
                <ShieldCheck size={14} color="#7c3aed" /> Ethical Standard
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-600)', margin: 0 }}>
                Strict epistemological separation: attention and comprehension are never claimed as directly detected facts.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sessions',
      title: '2. Course Session Lifecycle & Demo Cohort',
      subtitle: 'Live, Completed, and Scheduled Classes with Synthetic Demo Cohort',
      icon: Database,
      badgeColor: '#059669',
      badgeBg: '#ecfdf5',
      targetTab: 'sessions',
      targetLabel: 'View Course Sessions',
      content: (
        <div>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: 1.6, marginBottom: '14px' }}>
            The application includes 8 pre-enrolled students with realistic profiles and 3 session stages to demonstrate the complete academic workflow:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#166534', fontSize: '13px' }}>CS-401: Deep Learning & Attention Mechanics</span>
                <p style={{ fontSize: '11.5px', color: '#15803d', margin: '2px 0 0 0' }}>Status: LIVE (Active right now) • 8 Students • 35 min elapsed telemetry</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: 'var(--radius-full)', backgroundColor: '#22c55e', color: '#fff' }}>● LIVE</span>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)', backgroundColor: 'var(--slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '13px' }}>DS-204: Advanced Data Structures & Algorithms</span>
                <p style={{ fontSize: '11.5px', color: 'var(--slate-600)', margin: '2px 0 0 0' }}>Status: COMPLETED • Prior baseline data for cross-session drop analysis</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--slate-200)', color: 'var(--slate-700)' }}>COMPLETED</span>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)', backgroundColor: 'var(--slate-50)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '13px' }}>AI-502: Multimodal Machine Learning Architectures</span>
                <p style={{ fontSize: '11.5px', color: 'var(--slate-600)', margin: '2px 0 0 0' }}>Status: SCHEDULED • Upcoming lecture ready for classroom initiation</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)' }}>SCHEDULED</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'vision',
      title: '3. OpenCV Vision Scanner & Teacher Attendance Sign-Off',
      subtitle: 'Zero Biometric Surveillance in Scanners with Human-in-the-Loop Signoff',
      icon: Camera,
      badgeColor: '#0284c7',
      badgeBg: '#f0f9ff',
      targetTab: 'vision-scanner',
      targetLabel: 'Open Vision Scanner',
      content: (
        <div>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: 1.6, marginBottom: '14px' }}>
            The <strong>Vision Scanner</strong> analyzes classroom images (.jpg, .png, .webp) and video recordings (.mp4, .avi) using local OpenCV without calling external cloud vision APIs:
          </p>
          <ul style={{ fontSize: '12.5px', color: 'var(--slate-700)', lineHeight: 1.6, paddingLeft: '20px', margin: '0 0 14px 0' }}>
            <li><strong>Instantaneous Person Detection:</strong> Returns frame-level headcounts and bounding boxes. Detections are never assumed to be unique identities across frames.</li>
            <li><strong>Dual Detector Modes:</strong> Built-in OpenCV Adaptive Contour Detector (works with 0 downloads) + optional MobileNet-SSD / YOLO ONNX neural detector.</li>
            <li><strong>Human-in-the-Loop Sign-off:</strong> Detections populate a review table where the authorized teacher signs off on present/late/absent status. Records are tagged <code>vision_assisted_manual_confirm</code>.</li>
            <li><strong>Ephemeral Media Processing:</strong> Uploaded media is processed in volatile memory and discarded by default. Optional retention includes dedicated file-by-file deletion.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'audio',
      title: '4. Classroom Audio Intelligence & Voice Activity (VAD)',
      subtitle: 'Dual-Feature Acoustic Telemetry with System Killswitch',
      icon: Volume2,
      badgeColor: '#d97706',
      badgeBg: '#fffbeb',
      targetTab: 'audio-intelligence',
      targetLabel: 'Open Audio Intelligence',
      content: (
        <div>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: 1.6, marginBottom: '14px' }}>
            The <strong>Audio Intelligence Module</strong> decodes WAV, OGG, and FLAC audio files locally using <code>soundfile</code>, <code>NumPy</code>, and <code>SciPy</code>:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '12.5px', marginBottom: '4px' }}>
                Dual-Feature VAD
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-600)', margin: 0 }}>
                Combines Root-Mean-Square (RMS) volume energy with Zero-Crossing Rate (ZCR) bandpass filtering (0.018 - 0.58) and hangover median smoothing.
              </p>
            </div>
            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '12.5px', marginBottom: '4px' }}>
                Silence Tracking & Turnover
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--slate-600)', margin: 0 }}>
                Pinpoints reflective pause intervals (&ge;0.40s) and estimates dialogue turnover without transcribing spoken conversations.
              </p>
            </div>
          </div>
          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', fontSize: '11.5px', color: '#9a3412' }}>
            <strong>Administrative Kill-Switch:</strong> Instructors can disable audio uploads and live mic processing entirely via the system toggle.
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      title: '5. Multimodal Analytics & Engagement Curves',
      subtitle: '60/40 Multimodal Fusion with Interactive Recharts Curves',
      icon: BarChart3,
      badgeColor: '#2563eb',
      badgeBg: '#eff6ff',
      targetTab: 'analytics',
      targetLabel: 'View Engagement Analytics',
      content: (
        <div>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: 1.6, marginBottom: '14px' }}>
            The <strong>Analytics Module</strong> synthesizes optical and acoustic signals into responsive telemetry curves and ranking metrics:
          </p>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '6px' }}>
              Multimodal Engagement Fusion Formula:
            </div>
            <code style={{ fontSize: '12px', backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-300)', display: 'block', color: 'var(--primary-700)', fontWeight: 700 }}>
              Composite Engagement = (0.60 × Visual Attention Score) + (0.40 × Vocal Participation Index)
            </code>
          </div>
          <ul style={{ fontSize: '12px', color: 'var(--slate-700)', lineHeight: 1.5, paddingLeft: '20px', margin: 0 }}>
            <li><strong>Minute-by-minute timeline:</strong> Recharts area charts displaying visual focus vs acoustic activity across the 35-minute session.</li>
            <li><strong>Student Leaderboard:</strong> Ranks student consistency, participation frequency, and attendance verification methods.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'recommendations',
      title: '6. Rule-Based AI Recommendation Agent',
      subtitle: '8 Deterministic Rules with Supporting Signals and Teacher Actions',
      icon: Lightbulb,
      badgeColor: '#7c3aed',
      badgeBg: '#f5f3ff',
      targetTab: 'insights',
      targetLabel: 'Open AI Recommendations',
      content: (
        <div>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: 1.6, marginBottom: '14px' }}>
            The <strong>Pedagogical Recommendation Agent</strong> operates with 8 codified deterministic rules that synthesize attendance, speech ratio, silence intervals, and spatial headcounts:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <strong>RULE_LOW_PARTICIPATION_QA:</strong> Recommends structured Q&A when vocal ratio &lt; 20%.
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <strong>RULE_PROLONGED_MONOLOGUE_PAUSE:</strong> Suggests reflection pause when speech density &gt; 70%.
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <strong>RULE_HEADCOUNT_DISCREPANCY:</strong> Flags differences between camera count and roster.
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <strong>RULE_ATTENDANCE_DROP_REVIEW:</strong> Detects &ge;15% attendance drops against course baseline.
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--slate-600)' }}>
            Each card provides a <strong>Teacher Feedback Loop</strong>: click <em>Apply</em> to record implementation notes or <em>Dismiss</em> with deliberate pedagogical rationale.
          </div>
        </div>
      )
    },
    {
      id: 'ethics',
      title: '7. Epistemological Standard & Privacy Guarantees',
      subtitle: 'Strict Separation of Measured Signals vs Unobservable Mental States',
      icon: Lock,
      badgeColor: '#dc2626',
      badgeBg: '#fef2f2',
      targetTab: 'overview',
      targetLabel: 'Return to Dashboard',
      content: (
        <div>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', lineHeight: 1.6, marginBottom: '14px' }}>
            To uphold academic rigor and ethical standards, the system implements a formal Epistemological Integrity Standard:
          </p>
          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '12px' }}>
            <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '13px', marginBottom: '6px' }}>
              Academic Integrity Declaration:
            </div>
            <p style={{ fontSize: '12px', color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>
              "Attention, emotional affect, comprehension, and learning outcomes are internal psychological states and are NEVER presented as directly measured facts. All system outputs are strictly partitioned into physical sensor observations, statistical estimators, and heuristic pedagogical recommendations."
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', fontSize: '11.5px' }}>
              <span style={{ fontWeight: 700, color: 'var(--emerald-600)', display: 'block', marginBottom: '2px' }}>OBSERVED MEASUREMENT</span>
              Direct physical/roster facts (e.g. 6/8 students present).
            </div>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', fontSize: '11.5px' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary-600)', display: 'block', marginBottom: '2px' }}>STATISTICAL ESTIMATE</span>
              Derived metrics (e.g. 28% vocal index, 42s silence).
            </div>
            <div style={{ padding: '10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', fontSize: '11.5px' }}>
              <span style={{ fontWeight: 700, color: '#7c3aed', display: 'block', marginBottom: '2px' }}>RECOMMENDATION</span>
              Actionable teaching advice for facilitation pacing.
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = demoSteps[currentStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--slate-50)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-600)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-blue)'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                  College Project Demonstration Tour
                </h3>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-100)',
                    color: 'var(--primary-700)'
                  }}
                >
                  STEP {currentStep + 1} OF {demoSteps.length}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', margin: '2px 0 0 0' }}>
                Guided evaluation walkthrough of the Multimodal Attendance & Engagement Agent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Tour"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)',
              backgroundColor: '#ffffff',
              color: 'var(--slate-500)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div style={{ display: 'flex', width: '100%', height: '4px', backgroundColor: 'var(--slate-100)' }}>
          {demoSteps.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: idx <= currentStep ? 'var(--primary-600)' : 'transparent',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              title={`Step ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Step Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            padding: '10px 24px',
            borderBottom: '1px solid var(--slate-100)',
            gap: '6px',
            backgroundColor: '#ffffff'
          }}
        >
          {demoSteps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                border: idx === currentStep ? '1px solid var(--primary-300)' : '1px solid transparent',
                backgroundColor: idx === currentStep ? 'var(--primary-50)' : 'transparent',
                color: idx === currentStep ? 'var(--primary-700)' : 'var(--slate-500)',
                fontSize: '11px',
                fontWeight: idx === currentStep ? 700 : 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {idx + 1}. {s.title.split('.')[1] || s.title}
            </button>
          ))}
        </div>

        {/* Step Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: currentStepData.badgeBg,
                color: currentStepData.badgeColor
              }}
            >
              <currentStepData.icon size={20} />
            </span>
            <div>
              <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                {currentStepData.title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', margin: '2px 0 0 0' }}>
                {currentStepData.subtitle}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            {currentStepData.content}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--slate-50)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--slate-200)',
                backgroundColor: '#ffffff',
                color: currentStep === 0 ? 'var(--slate-300)' : 'var(--slate-700)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              onClick={() => {
                onNavigateTab(currentStepData.targetTab);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-200)',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-700)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title={`Switch to ${currentStepData.targetLabel}`}
            >
              {currentStepData.targetLabel} <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentStep < demoSteps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(demoSteps.length - 1, prev + 1))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-600)',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--emerald-600)',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <CheckCircle2 size={16} /> Finish Tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
