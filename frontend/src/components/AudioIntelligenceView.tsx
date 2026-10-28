import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  MicOff,
  UploadCloud,
  AlertTriangle,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Clock,
  HardDrive,
  Sliders,
  Power
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import type {
  AudioStatusResponse,
  AudioAnalysisResponse
} from '../types';

export const AudioIntelligenceView: React.FC = () => {
  // Configuration state
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [retainAudio, setRetainAudio] = useState<boolean>(false);
  const [frameInterval, setFrameInterval] = useState<number>(0.20);

  // Audio system status
  const [systemStatus, setSystemStatus] = useState<AudioStatusResponse | null>(null);
  const [isTogglingKillswitch, setIsTogglingKillswitch] = useState<boolean>(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Results state
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResponse | null>(null);
  const [activeRetainedId, setActiveRetainedId] = useState<string | null>(null);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [showVADDocs, setShowVADDocs] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch audio status on mount
  useEffect(() => {
    loadAudioStatus();
  }, []);

  const loadAudioStatus = async () => {
    try {
      const status = await api.getAudioStatus();
      setSystemStatus(status);
    } catch (err: any) {
      console.warn('Could not load audio status:', err);
    }
  };

  // Toggle administrative kill-switch
  const handleToggleKillswitch = async () => {
    if (!systemStatus) return;
    try {
      setIsTogglingKillswitch(true);
      setValidationError(null);
      const nextState = !systemStatus.audio_processing_enabled;
      const res = await api.toggleAudioProcessing(nextState);
      setSystemStatus((prev) => prev ? { ...prev, audio_processing_enabled: res.audio_processing_enabled } : null);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to toggle audio processing status.');
    } finally {
      setIsTogglingKillswitch(false);
    }
  };

  // File selection & validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    const allowed = ['.wav', '.ogg', '.flac'];
    if (!allowed.includes(ext)) {
      setValidationError(`Invalid audio format '${ext}'. Allowed extensions: ${allowed.join(', ')}`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setValidationError(`Audio file size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 25 MB limit.`);
      return;
    }

    setSelectedFile(file);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
  };

  // Synthetic Audio Generator for 1-Click Browser Evaluation
  const handleLoadSampleAudio = () => {
    setValidationError(null);
    try {
      const sampleRate = 16000;
      const durationSeconds = 3.0;
      const totalSamples = sampleRate * durationSeconds;
      const buffer = new ArrayBuffer(44 + totalSamples * 2);
      const view = new DataView(buffer);

      // RIFF identifier 'RIFF'
      view.setUint32(0, 0x52494646, false);
      view.setUint32(4, 36 + totalSamples * 2, true);
      // 'WAVE'
      view.setUint32(8, 0x57415645, false);
      // 'fmt ' chunk
      view.setUint32(12, 0x666d7420, false);
      view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
      view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
      view.setUint16(22, 1, true);  // NumChannels (1 = Mono)
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); // ByteRate
      view.setUint16(32, 2, true);  // BlockAlign
      view.setUint16(34, 16, true); // BitsPerSample
      // 'data' chunk
      view.setUint32(36, 0x64617461, false);
      view.setUint32(40, totalSamples * 2, true);

      // Tone section (first 1.5s 440Hz tone) + Silence section (second 1.5s silence)
      let offset = 44;
      for (let i = 0; i < totalSamples; i++) {
        let sample = 0;
        if (i < totalSamples / 2) {
          sample = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 16000;
        }
        view.setInt16(offset, sample, true);
        offset += 2;
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const file = new File([blob], 'classroom_lecture_sample.wav', { type: 'audio/wav' });
      setSelectedFile(file);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    } catch (err: any) {
      console.error('Failed to create sample audio clip:', err);
    }
  };

  // Run Analysis
  const handleRunAnalysis = async () => {
    if (!systemStatus?.audio_processing_enabled && !demoMode) {
      setValidationError('Audio processing is currently disabled by administrative policy. Re-enable it or test in Demo Mode.');
      return;
    }

    if (!selectedFile && !demoMode) {
      setValidationError('Please select a local WAV file or enable Demo Mode to run analysis.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setValidationError(null);

      // Create fallback dummy file for demo mode if none selected
      let fileToUpload = selectedFile;
      if (!fileToUpload) {
        const dummyBlob = new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46])], { type: 'audio/wav' });
        fileToUpload = new File([dummyBlob], 'demo_classroom_audio.wav', { type: 'audio/wav' });
      }

      const result = await api.analyzeWav(fileToUpload, demoMode, frameInterval, retainAudio);
      setAnalysisResult(result);
      if (result.retained_file_id) {
        setActiveRetainedId(result.retained_file_id);
      }
    } catch (err: any) {
      setValidationError(err.message || 'Audio analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete retained file
  const handleDeleteRetainedAudio = async () => {
    if (!activeRetainedId) return;
    try {
      await api.deleteRetainedAudioFile(activeRetainedId);
      setActiveRetainedId(null);
      setStorageNotice('Retained audio file was permanently deleted from server.');
      setTimeout(() => setStorageNotice(null), 4000);
    } catch (err: any) {
      setStorageNotice(`Failed to delete audio file: ${err.message}`);
    }
  };

  const handleClearAllRetainedAudio = async () => {
    try {
      const res = await api.clearAllRetainedAudioFiles();
      setActiveRetainedId(null);
      setStorageNotice(`Cleaned up ${res.files_deleted} temporary audio files.`);
      setTimeout(() => setStorageNotice(null), 4000);
    } catch (err: any) {
      setStorageNotice(`Failed to clear audio files: ${err.message}`);
    }
  };

  const isAudioDisabled = Boolean(systemStatus && !systemStatus.audio_processing_enabled);

  // Chart data mapping
  const chartData = (analysisResult?.timeline || []).map((m) => ({
    time: m.timestamp_formatted,
    rms: m.rms_energy,
    speech: m.speech_active ? m.rms_energy : 0
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Privacy Guarantee & Scientific Validity Header Banner */}
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '780px' }}>
          <div style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isAudioDisabled ? 'var(--rose-50)' : 'var(--primary-50)',
            color: isAudioDisabled ? 'var(--rose-600)' : 'var(--primary-600)',
            marginTop: '2px'
          }}>
            <Volume2 size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Classroom Audio Intelligence & Acoustic Telemetry
              </h2>
              <span style={{
                backgroundColor: isAudioDisabled ? 'var(--rose-50)' : 'var(--emerald-50)',
                color: isAudioDisabled ? 'var(--rose-700)' : 'var(--emerald-700)',
                border: `1px solid ${isAudioDisabled ? 'var(--rose-200)' : 'var(--emerald-200)'}`,
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}>
                {isAudioDisabled ? 'Processing Disabled' : 'Strict Non-Biometric'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '4px', lineHeight: 1.5, margin: 0 }}>
              Analyzes audio duration, silence intervals, RMS energy, and voice activity. 
              <strong> Zero speaker identification or speech transcription.</strong>
            </p>
            <p style={{ fontSize: '12px', color: 'var(--primary-700)', fontWeight: 600, marginTop: '4px', margin: 0 }}>
              Scientific Integrity: Loudness reflects physical acoustic energy and is never equated to cognitive student engagement.
            </p>
          </div>
        </div>

        {/* Master Killswitch & Documentation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowVADDocs(!showVADDocs)}
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
            <Sliders size={14} /> VAD Algorithm Guide
          </button>

          {/* Administrative Killswitch Toggle */}
          <button
            onClick={handleToggleKillswitch}
            disabled={isTogglingKillswitch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: isAudioDisabled ? '1px solid var(--emerald-300)' : '1px solid var(--rose-300)',
              backgroundColor: isAudioDisabled ? 'var(--emerald-50)' : 'var(--rose-50)',
              color: isAudioDisabled ? 'var(--emerald-700)' : 'var(--rose-700)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isTogglingKillswitch ? 'not-allowed' : 'pointer'
            }}
          >
            <Power size={14} />
            {isAudioDisabled ? 'Enable Audio Processing' : 'Disable Audio Processing Entirely'}
          </button>
        </div>
      </div>

      {/* VAD Algorithm Accordion */}
      {showVADDocs && (
        <div style={{
          backgroundColor: 'var(--slate-900)',
          color: '#e2e8f0',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          fontSize: '13px',
          lineHeight: 1.6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              Voice Activity Detection (VAD) Algorithm & Method Documentation
            </h3>
            <button
              onClick={() => setShowVADDocs(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
          <p>
            The audio module implements a dual-feature adaptive Voice Activity Detection method without requiring heavy neural speech-to-text models:
          </p>
          <ol style={{ paddingLeft: '20px', marginTop: '6px', marginBottom: '8px' }}>
            <li><strong>Adaptive Noise Floor:</strong> Computes the 15th percentile of frame-level RMS energy to adapt to diverse classroom acoustic environments.</li>
            <li><strong>Zero-Crossing Rate (ZCR) Bandpass Filter:</strong> Enforces human vocal tract zero-crossing limits (between 0.018 and 0.58), filtering out persistent AC hum and high-frequency friction noise.</li>
            <li><strong>Hangover Median Smoothing:</strong> Applies a 3-frame (~600ms) hangover filter to bridge natural syllable and breath pauses.</li>
            <li><strong>Silence Intervals:</strong> Sequences of unvoiced frames below speech energy threshold exceeding 0.4 seconds are tagged as silence reflection intervals.</li>
          </ol>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
            Libraries Active: <strong>{systemStatus?.active_engine || 'soundfile + numpy'}</strong> | Audio Residency: <strong>Transient Memory Only</strong>
          </div>
        </div>
      )}

      {/* Kill-switch Warning Banner */}
      {isAudioDisabled && (
        <div style={{
          backgroundColor: 'var(--rose-50)',
          border: '1px solid var(--rose-200)',
          color: 'var(--rose-800)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <MicOff size={20} color="var(--rose-600)" />
          <div>
            <strong>Audio Processing is Administratively Disabled.</strong> All audio uploads and live microphone analysis are locked out. Use the toggle above to re-enable processing when authorized.
          </div>
        </div>
      )}

      {/* Main Upload & Controls Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 340px',
        gap: '24px'
      }}>
        {/* Left Column: Upload & Audio Player */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          padding: '22px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
              Classroom Audio Upload
            </h3>
            <button
              onClick={handleLoadSampleAudio}
              style={{
                background: 'none',
                border: '1px solid var(--primary-300)',
                color: 'var(--primary-700)',
                backgroundColor: 'var(--primary-50)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Load Synthetic Audio Clip
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--slate-300)',
              borderRadius: 'var(--radius-md)',
              padding: '28px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--slate-50)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".wav,.ogg,.flac"
              style={{ display: 'none' }}
            />
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UploadCloud size={24} />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)', margin: 0 }}>
                {selectedFile ? selectedFile.name : 'Click to upload local WAV audio'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px', margin: 0 }}>
                Supports WAV (16-bit / 24-bit PCM mono or stereo) up to 25 MB
              </p>
            </div>
          </div>

          {/* Audio Player Preview */}
          {audioPreviewUrl && (
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--slate-100)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                Audio Playback Preview:
              </span>
              <audio src={audioPreviewUrl} controls style={{ width: '100%', height: '36px' }} />
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div style={{
              backgroundColor: 'var(--rose-50)',
              border: '1px solid var(--rose-200)',
              color: 'var(--rose-700)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Right Column: Analysis Controls */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          padding: '22px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
            Analysis Settings
          </h3>

          {/* Mode Switch: Demo vs Actual */}
          <div style={{
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: demoMode ? 'var(--amber-50)' : 'var(--emerald-50)',
            border: `1px solid ${demoMode ? 'var(--amber-200)' : 'var(--emerald-200)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '13px', color: demoMode ? 'var(--amber-800)' : 'var(--emerald-800)' }}>
                  {demoMode ? 'Demo Simulation Mode' : 'Local Audio Engine'}
                </strong>
                <p style={{ fontSize: '11px', color: demoMode ? 'var(--amber-700)' : 'var(--emerald-700)', margin: '2px 0 0 0' }}>
                  {demoMode ? 'Generates realistic telemetry without files' : 'Decodes uploaded WAV file'}
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Demo</span>
              </label>
            </div>
          </div>

          {/* Frame Sampling Granularity */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '6px' }}>
              Analysis Frame Interval
            </label>
            <select
              value={frameInterval}
              onChange={(e) => setFrameInterval(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--slate-300)',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value={0.10}>Every 0.10s (100ms - Fine Resolution)</option>
              <option value={0.20}>Every 0.20s (200ms - Standard)</option>
              <option value={0.50}>Every 0.50s (500ms - Overview)</option>
            </select>
          </div>

          {/* Privacy & Storage Option */}
          <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={retainAudio}
                onChange={(e) => setRetainAudio(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Retain audio file on local server
                </span>
                <p style={{ fontSize: '11px', color: 'var(--slate-500)', margin: '2px 0 0 0' }}>
                  Default is untracked volatile memory (discarded after analysis). Check to retain.
                </p>
              </div>
            </label>
          </div>

          {/* Execute CTA */}
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || (isAudioDisabled && !demoMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isAnalyzing || (isAudioDisabled && !demoMode) ? 'not-allowed' : 'pointer',
              opacity: isAnalyzing || (isAudioDisabled && !demoMode) ? 0.6 : 1,
              boxShadow: 'var(--shadow-blue)'
            }}
          >
            {isAnalyzing ? (
              <>
                <RotateCcw size={16} className="animate-spin" />
                Analyzing Audio Telemetry...
              </>
            ) : (
              <>
                <Mic size={16} /> Run Audio Intelligence Analysis
              </>
            )}
          </button>

          {/* Retention deletion controls */}
          {activeRetainedId && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--slate-100)',
              border: '1px solid var(--slate-200)'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--slate-600)', fontFamily: 'monospace' }}>
                Retained: {activeRetainedId.substring(0, 8)}...
              </span>
              <button
                onClick={handleDeleteRetainedAudio}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--rose-50)',
                  border: '1px solid var(--rose-200)',
                  color: 'var(--rose-700)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={12} /> Delete Retained Audio
              </button>
            </div>
          )}

          {/* Clear all files utility */}
          <button
            onClick={handleClearAllRetainedAudio}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--slate-500)',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <HardDrive size={13} /> Clean all temporary server audio uploads
          </button>

          {storageNotice && (
            <p style={{ fontSize: '11px', color: 'var(--emerald-600)', margin: 0, textAlign: 'center' }}>
              {storageNotice}
            </p>
          )}
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Header Stats & Demo Label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid var(--slate-100)',
            paddingBottom: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                  Acoustic Telemetry & Speech Intelligence Output
                </h3>
                {analysisResult.is_simulated ? (
                  <span style={{
                    backgroundColor: 'var(--amber-100)',
                    color: 'var(--amber-800)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    DEMO SIMULATION
                  </span>
                ) : (
                  <span style={{
                    backgroundColor: 'var(--emerald-100)',
                    color: 'var(--emerald-800)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    ACTUAL WAV DECODE
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px', margin: 0 }}>
                {analysisResult.disclaimer}
              </p>
            </div>

            {/* Atmosphere Badge */}
            <div style={{
              padding: '8px 16px',
              borderRadius: '999px',
              backgroundColor: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              color: 'var(--primary-700)',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={16} /> Environment: {analysisResult.acoustic_environment.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--slate-50)',
              border: '1px solid var(--slate-200)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 600, display: 'block' }}>
                Total Duration
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-800)' }}>
                {analysisResult.duration_seconds}s
              </span>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--emerald-50)',
              border: '1px solid var(--emerald-200)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--emerald-700)', fontWeight: 600, display: 'block' }}>
                Speech Duration
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald-700)' }}>
                {analysisResult.speech_duration_seconds}s ({analysisResult.speech_ratio_percentage}%)
              </span>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--slate-50)',
              border: '1px solid var(--slate-200)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 600, display: 'block' }}>
                Silence Duration
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-800)' }}>
                {analysisResult.silence_duration_seconds}s ({analysisResult.silence_ratio_percentage}%)
              </span>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--primary-700)', fontWeight: 600, display: 'block' }}>
                Vocal Participation Index
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-700)' }}>
                {Math.round(analysisResult.vocal_participation_index * 100)}%
              </span>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--slate-50)',
              border: '1px solid var(--slate-200)',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 600, display: 'block' }}>
                Dialogue Turns Estimated
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-800)' }}>
                {analysisResult.dialogue_turns_estimated} turns
              </span>
            </div>
          </div>

          {/* Interactive Recharts RMS Energy & Speech Activity Timeline */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '12px' }}>
              RMS Energy Curve & Speech Activity Timeline (Decibels & Volts)
            </h4>
            <div style={{ width: '100%', height: '260px', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', padding: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rmsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary-600)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary-600)" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="speechGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="rms" name="RMS Energy" stroke="var(--primary-600)" fillOpacity={1} fill="url(#rmsGradient)" />
                  <Area type="monotone" dataKey="speech" name="Active Speech" stroke="#10b981" fillOpacity={1} fill="url(#speechGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Silence Intervals Breakdown */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '10px' }}>
              Detected Silence & Reflection Intervals ({analysisResult.silence_intervals.length} intervals)
            </h4>
            {analysisResult.silence_intervals.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--slate-500)', margin: 0 }}>No silence intervals (&gt; 0.4s) detected in audio clip.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {analysisResult.silence_intervals.map((inv, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--slate-100)',
                      border: '1px solid var(--slate-200)',
                      fontSize: '12px',
                      color: 'var(--slate-700)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Clock size={13} color="var(--slate-500)" />
                    <span>Interval #{idx + 1}: <strong>{inv.start_seconds}s - {inv.end_seconds}s</strong> ({inv.duration_seconds}s pause)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
