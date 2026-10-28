import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Camera,
  Play,
  Pause,
  Sparkles,
  AlertTriangle,
  Zap,
  Volume2,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { FrameProcessResponse, RecognizedStudentInFrame, ClassSession } from '../types';

interface LiveMonitorViewProps {
  activeSession: ClassSession | null;
  onRefreshAllData?: () => void;
}

export const LiveMonitorView: React.FC<LiveMonitorViewProps> = ({
  activeSession,
  onRefreshAllData
}) => {
  const [streamMode, setStreamMode] = useState<'simulation' | 'webcam'>('simulation');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [autoMarkAttendance, setAutoMarkAttendance] = useState<boolean>(true);
  const [simulateCohort, setSimulateCohort] = useState<boolean>(true);
  const [intervalMs, setIntervalMs] = useState<number>(3000);

  // Video / Audio refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [audioMeterLevel, setAudioMeterLevel] = useState<number>(0.12);

  // Real-time state from backend
  const [latestFrame, setLatestFrame] = useState<FrameProcessResponse | null>(null);
  const [processedFramesCount, setProcessedFramesCount] = useState<number>(0);
  const [recentInterventions, setRecentInterventions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize WebRTC webcam if mode is webcam
  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animFrame: number;

    async function startCamera() {
      if (streamMode === 'webcam') {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: true
          });
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play();
          }

          // Audio meter
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          audioContext = new AudioCtx();
          const source = audioContext.createMediaStreamSource(mediaStream);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudioLevel = () => {
            if (analyser) {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioMeterLevel(Math.min(1.0, avg / 128.0));
            }
            animFrame = requestAnimationFrame(updateAudioLevel);
          };
          updateAudioLevel();
        } catch (err: any) {
          console.warn('Webcam permission error or no camera attached:', err);
          setStreamMode('simulation');
          setErrorMessage('Camera access was not granted or not detected. Switched to Simulation Stream Mode.');
        }
      }
    }

    startCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
      cancelAnimationFrame(animFrame);
    };
  }, [streamMode]);

  // Capture frame & send to backend
  const captureAndIngest = async () => {
    if (!activeSession) return;
    setIsProcessing(true);
    try {
      let imageBase64: string | null = null;

      if (streamMode === 'webcam' && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, 640, 480);
          imageBase64 = canvas.toDataURL('image/jpeg', 0.7);
        }
      }

      const res = await api.processMultimodalFrame({
        session_id: activeSession.id,
        image_base64: imageBase64,
        audio_level: streamMode === 'webcam' ? audioMeterLevel : Math.random() * 0.2 + 0.05,
        mark_attendance_if_matched: autoMarkAttendance,
        simulate_multi_student: simulateCohort
      });

      setLatestFrame(res);
      setProcessedFramesCount((prev) => prev + 1);

      if (res.active_alerts && res.active_alerts.length > 0) {
        setRecentInterventions((prev) => [...res.active_alerts, ...prev].slice(0, 8));
      }

      if (onRefreshAllData && autoMarkAttendance) {
        onRefreshAllData();
      }
    } catch (err: any) {
      console.error('Frame ingestion error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Continuous stream interval loop
  useEffect(() => {
    if (!isStreaming) return;
    // Initial call
    captureAndIngest();

    const timer = setInterval(() => {
      captureAndIngest();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isStreaming, streamMode, intervalMs, autoMarkAttendance, simulateCohort, activeSession]);

  const studentsList: RecognizedStudentInFrame[] = latestFrame?.students_recognized || [
    {
      student_id: 1,
      student_name: 'Aarav Sharma',
      confidence: 0.96,
      gaze: 'center',
      drowsiness: false,
      emotion: 'focused',
      attention: 0.92,
      engagement: 0.89,
      head_pose: { pitch: 1.2, yaw: -0.8, roll: 0.1 }
    },
    {
      student_id: 2,
      student_name: 'Sophia Chen',
      confidence: 0.94,
      gaze: 'center',
      drowsiness: false,
      emotion: 'focused',
      attention: 0.88,
      engagement: 0.86,
      head_pose: { pitch: -0.5, yaw: 1.5, roll: -0.3 }
    },
    {
      student_id: 3,
      student_name: 'Marcus Vance',
      confidence: 0.91,
      gaze: 'down',
      drowsiness: false,
      emotion: 'neutral',
      attention: 0.74,
      engagement: 0.76,
      head_pose: { pitch: 4.8, yaw: -2.1, roll: 0.5 }
    },
    {
      student_id: 4,
      student_name: 'Priya Patel',
      confidence: 0.95,
      gaze: 'center',
      drowsiness: false,
      emotion: 'focused',
      attention: 0.94,
      engagement: 0.92,
      head_pose: { pitch: 0.8, yaw: 0.2, roll: 0.0 }
    }
  ];

  const primaryFace = studentsList[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Control Deck Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Stream Mode Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--slate-100)',
            padding: '4px',
            borderRadius: 'var(--radius-md)'
          }}>
            <button
              onClick={() => setStreamMode('simulation')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: streamMode === 'simulation' ? 'var(--bg-surface)' : 'transparent',
                color: streamMode === 'simulation' ? 'var(--primary-700)' : 'var(--slate-600)',
                boxShadow: streamMode === 'simulation' ? 'var(--shadow-xs)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={14} /> Simulation Mode
            </button>
            <button
              onClick={() => setStreamMode('webcam')}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: streamMode === 'webcam' ? 'var(--bg-surface)' : 'transparent',
                color: streamMode === 'webcam' ? 'var(--primary-700)' : 'var(--slate-600)',
                boxShadow: streamMode === 'webcam' ? 'var(--shadow-xs)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Video size={14} /> Live Webcam & Mic
            </button>
          </div>

          {/* Pause / Resume Stream */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-300)',
              backgroundColor: isStreaming ? 'var(--slate-50)' : 'var(--primary-50)',
              color: isStreaming ? 'var(--slate-700)' : 'var(--primary-700)',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {isStreaming ? (
              <>
                <Pause size={14} /> Pause Stream
              </>
            ) : (
              <>
                <Play size={14} /> Start Stream
              </>
            )}
          </button>

          {/* Interval selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--slate-600)' }}>
            <span>Interval:</span>
            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              style={{
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--slate-300)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '13px',
                color: 'var(--slate-800)'
              }}
            >
              <option value={1500}>1.5s (Fast)</option>
              <option value={3000}>3.0s (Normal)</option>
              <option value={5000}>5.0s (Relaxed)</option>
            </select>
          </div>
        </div>

        {/* Right side options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoMarkAttendance}
              onChange={(e) => setAutoMarkAttendance(e.target.checked)}
              style={{ accentColor: 'var(--primary-600)' }}
            />
            Auto-mark Attendance
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={simulateCohort}
              onChange={(e) => setSimulateCohort(e.target.checked)}
              style={{ accentColor: 'var(--primary-600)' }}
            />
            Multi-Student Cohort
          </label>

          <button
            onClick={captureAndIngest}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <Camera size={14} /> Ingest Snapshot
          </button>
        </div>
      </div>

      {errorMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--amber-50)',
          border: '1px solid var(--amber-500)',
          color: 'var(--amber-700)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Dual Grid: Video Monitor & Real-Time Analytics Deck */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Left Column: Visual Monitor with Computer Vision HUD Overlay */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          boxShadow: 'var(--shadow-xs)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isStreaming ? 'var(--emerald-500)' : 'var(--slate-400)',
                animation: isStreaming ? 'pulseDot 2s infinite' : 'none'
              }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                {streamMode === 'webcam' ? 'Live Camera Feed' : 'Synthesized Classroom Optical Feed'}
              </h3>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)' }}>
              Frames Ingested: {processedFramesCount}
            </span>
          </div>

          {/* Video Container with HUD Overlay */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '380px',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {streamMode === 'webcam' ? (
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              // Synthetic Classroom Feed Illustration
              <div style={{
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 50% 40%, #1e293b 0%, #090d16 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80"
                  alt="Classroom Simulation"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.55
                  }}
                />
              </div>
            )}

            {/* Hidden canvas for snapshotting */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* HUD Bounding Box Overlay for Primary Recognized Face */}
            {primaryFace && (
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '28%',
                width: '44%',
                height: '56%',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '8px'
              }}>
                {/* Corner crosshairs */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '12px', height: '12px', borderTop: '2px solid #60a5fa', borderLeft: '2px solid #60a5fa' }} />
                  <div style={{ width: '12px', height: '12px', borderTop: '2px solid #60a5fa', borderRight: '2px solid #60a5fa' }} />
                </div>

                {/* Face Tag */}
                <div style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#ffffff',
                  fontSize: '11px',
                  lineHeight: 1.3
                }}>
                  <div style={{ fontWeight: 700, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserCheck size={12} />
                    {primaryFace.student_name}
                    <span style={{ fontSize: '10px', color: '#34d399', marginLeft: 'auto' }}>
                      {Math.round(primaryFace.confidence * 100)}% match
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '3px', fontSize: '10px', color: '#cbd5e1' }}>
                    <span>Gaze: {primaryFace.gaze}</span>
                    <span>•</span>
                    <span>Emotion: {primaryFace.emotion}</span>
                    <span>•</span>
                    <span>Attention: {Math.round(primaryFace.attention * 100)}%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '12px', height: '12px', borderBottom: '2px solid #60a5fa', borderLeft: '2px solid #60a5fa' }} />
                  <div style={{ width: '12px', height: '12px', borderBottom: '2px solid #60a5fa', borderRight: '2px solid #60a5fa' }} />
                </div>
              </div>
            )}

            {/* Live Audio Visualizer Bar Bottom HUD */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '16px',
              right: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(8px)',
              padding: '8px 14px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Volume2 size={16} color="#60a5fa" />
                <span style={{ fontWeight: 600 }}>Classroom Acoustic Level:</span>
                <div style={{
                  width: '120px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: '#334155',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.round(audioMeterLevel * 100)}%`,
                    height: '100%',
                    backgroundColor: audioMeterLevel > 0.4 ? '#f59e0b' : '#3b82f6',
                    transition: 'width 0.1s ease-out'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: latestFrame?.audio_metrics?.speech_detected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(148, 163, 184, 0.2)',
                  color: latestFrame?.audio_metrics?.speech_detected ? '#34d399' : '#94a3b8'
                }}>
                  {latestFrame?.audio_metrics?.speech_detected ? 'Vocal Speech Active' : 'Quiet Attentive Atmosphere'}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry Stats under video */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            padding: '16px 20px',
            backgroundColor: 'var(--slate-50)',
            borderTop: '1px solid var(--slate-200)',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 600 }}>Faces Tracked</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>
                {latestFrame?.faces_detected ?? 4}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 600 }}>Cohort Engagement</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-600)' }}>
                {Math.round((latestFrame?.cohort_engagement_score ?? 0.84) * 100)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 600 }}>Gaze Focus</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--emerald-600)' }}>
                {primaryFace?.gaze === 'center' ? 'Direct (100%)' : 'Averted'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 600 }}>Drowsiness Alert</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: primaryFace?.drowsiness ? 'var(--rose-600)' : 'var(--emerald-600)' }}>
                {primaryFace?.drowsiness ? 'Detected' : 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Student Cohort Grid & Dynamic Interventions Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cohort Grid */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '14px' }}>
              Tracked Cohort Students
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {studentsList.map((stu) => {
                const isDrowsy = stu.drowsiness;
                return (
                  <div
                    key={stu.student_id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--slate-200)',
                      backgroundColor: isDrowsy ? 'var(--rose-50)' : 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {stu.student_name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--slate-500)', display: 'flex', gap: '6px' }}>
                        <span>Gaze: {stu.gaze}</span>
                        <span>•</span>
                        <span>Emotion: {stu.emotion}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: isDrowsy ? 'var(--rose-600)' : 'var(--primary-600)' }}>
                        {Math.round(stu.engagement * 100)}% Engaged
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isDrowsy ? 'var(--rose-100)' : 'var(--emerald-50)',
                        color: isDrowsy ? 'var(--rose-700)' : 'var(--emerald-700)'
                      }}>
                        {isDrowsy ? 'FATIGUE ALERT' : 'ATTENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Agent Interventions */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)',
            boxShadow: 'var(--shadow-xs)',
            flex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={18} color="var(--primary-600)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                Real-Time Agent Coaching
              </h3>
            </div>

            {latestFrame?.immediate_recommendation && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                marginBottom: '12px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase' }}>
                  Live Pedagogical Tip
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-800)', marginTop: '2px' }}>
                  {latestFrame.immediate_recommendation}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {recentInterventions.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                  Awaiting cognitive friction or engagement anomalies...
                </p>
              ) : (
                recentInterventions.map((alert, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '12px',
                      color: 'var(--slate-700)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--slate-50)',
                      borderLeft: '3px solid var(--amber-500)',
                      lineHeight: 1.35
                    }}
                  >
                    {alert}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
