import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Video,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  Info,
  HardDrive,
  Eye,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import type {
  ClassSession,
  Student,
  VisionModelStatus,
  ImageDetectionResponse,
  VideoDetectionResponse,
  TeacherConfirmAttendanceItem
} from '../types';

interface VisionScannerViewProps {
  sessions: ClassSession[];
  students: Student[];
  selectedSessionId: number;
  onSelectSession: (id: number) => void;
  onAttendanceConfirmed?: () => void;
}

export const VisionScannerView: React.FC<VisionScannerViewProps> = ({
  sessions,
  students,
  selectedSessionId,
  onSelectSession,
  onAttendanceConfirmed
}) => {
  // Mode & Configuration state
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [retainMedia, setRetainMedia] = useState<boolean>(false);
  const [videoSampleRate, setVideoSampleRate] = useState<number>(1.0);
  const [teacherName, setTeacherName] = useState<string>('Dr. Sarah Mitchell');

  // Model & Server status
  const [modelStatus, setModelStatus] = useState<VisionModelStatus | null>(null);

  // Upload & File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Results state
  const [imageResult, setImageResult] = useState<ImageDetectionResponse | null>(null);
  const [videoResult, setVideoResult] = useState<VideoDetectionResponse | null>(null);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(0);
  const [activeRetainedId, setActiveRetainedId] = useState<string | null>(null);

  // Teacher Review & Attendance Confirmation state
  const [studentStatuses, setStudentStatuses] = useState<Record<number, 'present' | 'late' | 'absent'>>({});
  const [studentNotes, setStudentNotes] = useState<Record<number, string>>({});
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState<boolean>(false);
  const [attendanceConfirmationMessage, setAttendanceConfirmationMessage] = useState<string | null>(null);

  // System management notification
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [showWeightsGuide, setShowWeightsGuide] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch model status on mount
  useEffect(() => {
    fetchModelStatus();
  }, []);

  const fetchModelStatus = async () => {
    try {
      const status = await api.getVisionModelStatus();
      setModelStatus(status);
    } catch (err: any) {
      console.warn('Could not load vision model status:', err);
    }
  };

  // Initialize student statuses for confirmation when students or detection changes
  useEffect(() => {
    if (students && students.length > 0) {
      const initial: Record<number, 'present' | 'late' | 'absent'> = {};
      const initialNotes: Record<number, string> = {};
      
      const detectedCount = mediaType === 'image' 
        ? (imageResult?.person_count || 0)
        : (videoResult?.peak_person_count || 0);

      students.forEach((stu, idx) => {
        // Pre-fill first N students as present if detected, others absent
        if (detectedCount > 0 && idx < detectedCount) {
          initial[stu.id] = 'present';
        } else {
          initial[stu.id] = 'absent';
        }
        initialNotes[stu.id] = '';
      });
      setStudentStatuses(initial);
      setStudentNotes(initialNotes);
    }
  }, [students, imageResult, videoResult, mediaType]);

  // File selection & validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (mediaType === 'image') {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
      if (!allowed.includes(ext)) {
        setValidationError(`Invalid image extension (${ext}). Allowed: ${allowed.join(', ')}`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setValidationError(`Image size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 10 MB limit.`);
        return;
      }
    } else {
      const allowed = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
      if (!allowed.includes(ext)) {
        setValidationError(`Invalid video extension (${ext}). Allowed: ${allowed.join(', ')}`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setValidationError(`Video size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 50 MB limit.`);
        return;
      }
    }

    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setImageResult(null);
    setVideoResult(null);
    setAttendanceConfirmationMessage(null);
  };

  // Helper to load synthetic classroom image sample for instant testing
  const handleLoadSampleImage = async () => {
    setValidationError(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 420;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Background room
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, 640, 420);
        // Desks
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(40, 160, 560, 20);
        ctx.fillRect(40, 280, 560, 20);
        // Student silhouettes
        const studentXPositions = [80, 200, 320, 440, 140, 260, 380];
        studentXPositions.forEach((x, i) => {
          const y = i < 4 ? 90 : 210;
          ctx.fillStyle = i % 2 === 0 ? '#3b82f6' : '#1e293b';
          // Head
          ctx.beginPath();
          ctx.arc(x + 25, y + 15, 15, 0, Math.PI * 2);
          ctx.fill();
          // Torso
          ctx.fillRect(x + 5, y + 32, 40, 55);
        });
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], 'classroom_sample_scan.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        setImageResult(null);
        setVideoResult(null);
        setAttendanceConfirmationMessage(null);
      }, 'image/jpeg');
    } catch (err) {
      console.error('Error generating sample:', err);
    }
  };

  // Execute Detection Analysis
  const handleRunAnalysis = async () => {
    if (!selectedFile && !demoMode) {
      setValidationError('Please select a media file or enable Demo Mode to run analysis.');
      return;
    }

    try {
      setIsProcessing(true);
      setValidationError(null);
      setAttendanceConfirmationMessage(null);

      // Create fallback dummy file for demo mode if none selected
      let fileToUpload = selectedFile;
      if (!fileToUpload) {
        const dummyBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
        const dummyBlob = new Blob([dummyBytes], { type: mediaType === 'image' ? 'image/jpeg' : 'video/mp4' });
        fileToUpload = new File([dummyBlob], mediaType === 'image' ? 'demo_classroom.jpg' : 'demo_classroom.mp4');
      }

      if (mediaType === 'image') {
        const result = await api.detectImage(fileToUpload, demoMode, retainMedia);
        setImageResult(result);
        if (result.retained_file_id) {
          setActiveRetainedId(result.retained_file_id);
        }
      } else {
        const result = await api.detectVideo(fileToUpload, videoSampleRate, demoMode, retainMedia);
        setVideoResult(result);
        setSelectedFrameIndex(0);
        if (result.retained_file_id) {
          setActiveRetainedId(result.retained_file_id);
        }
      }
    } catch (err: any) {
      setValidationError(err.message || 'Vision detection processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete retained media
  const handleDeleteRetainedMedia = async () => {
    if (!activeRetainedId) return;
    try {
      await api.deleteRetainedFile(activeRetainedId);
      setActiveRetainedId(null);
      setStorageNotice('Retained media file was permanently deleted from local server.');
      setTimeout(() => setStorageNotice(null), 4000);
    } catch (err: any) {
      setStorageNotice(`Failed to delete retained file: ${err.message}`);
    }
  };

  const handleClearAllRetainedFiles = async () => {
    try {
      const res = await api.clearAllRetainedFiles();
      setActiveRetainedId(null);
      setStorageNotice(`Cleaned up ${res.files_deleted} temporary server files.`);
      setTimeout(() => setStorageNotice(null), 4000);
    } catch (err: any) {
      setStorageNotice(`Failed to clear temporary files: ${err.message}`);
    }
  };

  // Submit authorized teacher manual confirmation
  const handleConfirmAttendance = async () => {
    if (!selectedSessionId) {
      setValidationError('Please select a target class session before confirming attendance.');
      return;
    }

    const detectedCount = mediaType === 'image' 
      ? (imageResult?.person_count || 0)
      : (videoResult?.peak_person_count || 0);

    const confirmations: TeacherConfirmAttendanceItem[] = Object.entries(studentStatuses).map(
      ([stuIdStr, status]) => ({
        student_id: Number(stuIdStr),
        status,
        notes: studentNotes[Number(stuIdStr)] || undefined
      })
    );

    try {
      setIsSubmittingAttendance(true);
      setValidationError(null);
      const res = await api.confirmTeacherAttendance({
        session_id: selectedSessionId,
        detection_source_type: mediaType,
        detected_headcount: detectedCount,
        authorized_teacher_name: teacherName || 'Authorized Instructor',
        confirmations
      });

      setAttendanceConfirmationMessage(
        `✓ ${res.message} (${res.confirmed_count} students recorded present/late).`
      );
      if (onAttendanceConfirmed) onAttendanceConfirmed();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to submit attendance confirmation.');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const activeDetectedCount = mediaType === 'image'
    ? (imageResult?.person_count ?? null)
    : (videoResult?.peak_person_count ?? null);

  const activeTimeline = videoResult?.frame_timeline || [];
  const currentVideoFrame = activeTimeline[selectedFrameIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* Privacy Guarantee & Architecture Banner */}
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
            backgroundColor: 'var(--emerald-50)',
            color: 'var(--emerald-600)',
            marginTop: '2px'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Classroom Vision Headcount & Attendance Review
              </h2>
              <span style={{
                backgroundColor: 'var(--emerald-50)',
                color: 'var(--emerald-600)',
                border: '1px solid var(--emerald-200)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}>
                Privacy Preserving
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '4px', lineHeight: 1.5 }}>
              Detects instantaneous room headcount with local OpenCV computer vision. 
              <strong> Zero facial recognition or biometric identification.</strong> Detections do not assume unique student identities across frames. Authorized teachers retain full manual review authority.
            </p>
          </div>
        </div>

        {/* Model status pill & docs button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowWeightsGuide(!showWeightsGuide)}
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
            <Sliders size={14} /> Model & Weights Guide
          </button>
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--slate-100)',
            border: '1px solid var(--slate-200)',
            fontSize: '11px',
            color: 'var(--slate-600)'
          }}>
            Detector: <strong style={{ color: 'var(--slate-800)' }}>{modelStatus?.active_detector || 'OpenCV Contour'}</strong>
          </div>
        </div>
      </div>

      {/* Model Weights Guide Accordion */}
      {showWeightsGuide && (
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
              Pretrained Person Detection Weights & Configuration
            </h3>
            <button
              onClick={() => setShowWeightsGuide(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
            >
              Close
            </button>
          </div>
          <p>
            The vision module runs out-of-the-box using OpenCV adaptive morphological contour detection without downloading external files. To run MobileNet-SSD or YOLO ONNX detection:
          </p>
          <ol style={{ paddingLeft: '20px', marginTop: '8px', marginBottom: '8px' }}>
            <li>Place <code>MobileNetSSD_deploy.prototxt</code> and <code>MobileNetSSD_deploy.caffemodel</code> inside <code>backend/models/weights/</code>.</li>
            <li>Alternatively, drop any YOLOv8/v11 ONNX person detector (e.g. <code>yolov8n.onnx</code>) into the same folder.</li>
            <li>The system will automatically detect the weights upon restart or reload.</li>
          </ol>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
            OpenCV Version: <strong>{modelStatus?.opencv_version || '5.0.0'}</strong> | Weights Directory: <code>{modelStatus?.weights_directory || 'backend/models/weights'}</code>
          </div>
        </div>
      )}

      {/* Top Controls Grid: Upload & Detection Settings */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 340px',
        gap: '24px'
      }}>
        {/* Left Column: Media Upload & Preview */}
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
          {/* Media Type Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--slate-200)', paddingBottom: '12px' }}>
            <button
              onClick={() => {
                setMediaType('image');
                setSelectedFile(null);
                setPreviewUrl(null);
                setImageResult(null);
                setVideoResult(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mediaType === 'image' ? 'var(--primary-600)' : 'var(--slate-100)',
                color: mediaType === 'image' ? '#ffffff' : 'var(--slate-700)'
              }}
            >
              <Camera size={16} /> Classroom Image (Max 10MB)
            </button>
            <button
              onClick={() => {
                setMediaType('video');
                setSelectedFile(null);
                setPreviewUrl(null);
                setImageResult(null);
                setVideoResult(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: mediaType === 'video' ? 'var(--primary-600)' : 'var(--slate-100)',
                color: mediaType === 'video' ? '#ffffff' : 'var(--slate-700)'
              }}
            >
              <Video size={16} /> Video File (Max 50MB)
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
              transition: 'border-color 0.2s',
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
              accept={mediaType === 'image' ? '.jpg,.jpeg,.png,.webp,.bmp' : '.mp4,.avi,.mov,.mkv,.webm'}
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
                {selectedFile ? selectedFile.name : `Click to upload classroom ${mediaType}`}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px', margin: 0 }}>
                {mediaType === 'image'
                  ? 'Supports JPG, PNG, WEBP, BMP up to 10MB'
                  : 'Supports MP4, AVI, MOV, MKV up to 50MB'}
              </p>
            </div>
          </div>

          {/* Quick 1-Click Sample Generator */}
          {mediaType === 'image' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Need test data?</span>
              <button
                onClick={handleLoadSampleImage}
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
                + Load Synthetic Classroom Frame
              </button>
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

          {/* Visual Canvas / Frame Preview */}
          {previewUrl && (
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              maxHeight: '360px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {mediaType === 'image' ? (
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    src={previewUrl}
                    alt="Classroom Scan Preview"
                    style={{ maxHeight: '340px', width: 'auto', display: 'block', maxWidth: '100%' }}
                  />
                  {/* Bounding Box Overlays */}
                  {imageResult && imageResult.bounding_boxes.map((b, i) => {
                    const scaleX = 100 / (imageResult.image_width || 640);
                    const scaleY = 100 / (imageResult.image_height || 480);
                    const [bx, by, bw, bh] = b.box;
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${bx * scaleX}%`,
                          top: `${by * scaleY}%`,
                          width: `${bw * scaleX}%`,
                          height: `${bh * scaleY}%`,
                          border: '2px solid #38bdf8',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          borderRadius: '2px',
                          pointerEvents: 'none'
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          top: '-18px',
                          left: 0,
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '2px'
                        }}>
                          Person #{i + 1} ({Math.round(b.confidence * 100)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <video
                  src={previewUrl}
                  controls
                  style={{ maxHeight: '340px', width: '100%' }}
                />
              )}
            </div>
          )}
        </div>

        {/* Right Column: Execution Configuration & Controls */}
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
            Execution Settings
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
                  {demoMode ? 'Simulation Mode' : 'Local OpenCV Engine'}
                </strong>
                <p style={{ fontSize: '11px', color: demoMode ? 'var(--amber-700)' : 'var(--emerald-700)', margin: '2px 0 0 0' }}>
                  {demoMode ? 'Generates realistic results without weights' : 'Runs OpenCV person detector'}
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

          {/* Video Sampling Interval (Only for Video) */}
          {mediaType === 'video' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '6px' }}>
                Video Sampling Interval
              </label>
              <select
                value={videoSampleRate}
                onChange={(e) => setVideoSampleRate(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--slate-300)',
                  fontSize: '13px'
                }}
              >
                <option value={0.5}>Every 0.5s (High granularity)</option>
                <option value={1.0}>Every 1.0s (Standard)</option>
                <option value={2.0}>Every 2.0s (Fast)</option>
                <option value={5.0}>Every 5.0s (Keyframe only)</option>
              </select>
            </div>
          )}

          {/* Privacy & Storage Option */}
          <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={retainMedia}
                onChange={(e) => setRetainMedia(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Retain file locally on server
                </span>
                <p style={{ fontSize: '11px', color: 'var(--slate-500)', margin: '2px 0 0 0' }}>
                  Default is untracked transient memory (discarded after processing). Check to retain.
                </p>
              </div>
            </label>
          </div>

          {/* Execute CTA Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={isProcessing}
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
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.7 : 1,
              boxShadow: 'var(--shadow-blue)'
            }}
          >
            {isProcessing ? (
              <>
                <RotateCcw size={16} className="animate-spin" />
                Analyzing with OpenCV...
              </>
            ) : (
              <>
                <Eye size={16} /> Run Vision Headcount Analysis
              </>
            )}
          </button>

          {/* Retention Deletion Actions */}
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
                onClick={handleDeleteRetainedMedia}
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
                <Trash2 size={12} /> Delete Retained File
              </button>
            </div>
          )}

          {/* Clear all files utility */}
          <button
            onClick={handleClearAllRetainedFiles}
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
            <HardDrive size={13} /> Clean all temporary server uploads
          </button>

          {storageNotice && (
            <p style={{ fontSize: '11px', color: 'var(--emerald-600)', margin: 0, textAlign: 'center' }}>
              {storageNotice}
            </p>
          )}
        </div>
      </div>

      {/* Detection Results Showcase */}
      {(imageResult || videoResult) && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--slate-200)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Source Banner & Headline Stats */}
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
                  Detection Analysis Output
                </h3>
                {((imageResult?.is_simulated) || (videoResult?.is_simulated)) ? (
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
                    OPENCV LOCAL ENGINE
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px', margin: 0 }}>
                {imageResult?.disclaimer || videoResult?.disclaimer}
              </p>
            </div>

            {/* Metric Pills */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--primary-700)', fontWeight: 600, display: 'block' }}>
                  {mediaType === 'image' ? 'Headcount Detected' : 'Peak Headcount'}
                </span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-700)' }}>
                  {activeDetectedCount ?? 0}
                </span>
              </div>

              {videoResult && (
                <div style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--slate-100)',
                  border: '1px solid var(--slate-200)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--slate-600)', fontWeight: 600, display: 'block' }}>
                    Average Headcount
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-800)' }}>
                    {videoResult.average_person_count}
                  </span>
                </div>
              )}

              <div style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--slate-100)',
                border: '1px solid var(--slate-200)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--slate-600)', fontWeight: 600, display: 'block' }}>
                  Processing Time
                </span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-800)' }}>
                  {Math.round(imageResult?.processing_time_ms || videoResult?.processing_time_ms || 0)}ms
                </span>
              </div>
            </div>
          </div>

          {/* Video Frame Timeline Scrubber (If Video) */}
          {videoResult && activeTimeline.length > 0 && (
            <div style={{
              backgroundColor: 'var(--slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)' }}>
                  Video Sampling Timeline ({videoResult.total_frames_sampled} frames sampled at {videoResult.sampling_interval_seconds}s intervals)
                </span>
                {currentVideoFrame && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-700)' }}>
                    Timestamp: {currentVideoFrame.timestamp_formatted} | Headcount: {currentVideoFrame.person_count} people
                  </span>
                )}
              </div>

              {/* Scrubber pills */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                {activeTimeline.map((frame, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedFrameIndex(idx)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: selectedFrameIndex === idx ? '2px solid var(--primary-600)' : '1px solid var(--slate-300)',
                      backgroundColor: selectedFrameIndex === idx ? 'var(--primary-100)' : '#ffffff',
                      color: selectedFrameIndex === idx ? 'var(--primary-800)' : 'var(--slate-700)',
                      fontSize: '11px',
                      fontWeight: selectedFrameIndex === idx ? 800 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {frame.timestamp_formatted} ({frame.person_count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notice: No Unique Identity Persisted Across Frames */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: 'var(--slate-50)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--slate-200)',
            fontSize: '12px',
            color: 'var(--slate-600)'
          }}>
            <Info size={16} color="var(--primary-600)" />
            <span>
              <strong>Privacy Standard:</strong> Each detection represents an instantaneous person count. 
              The system never assumes a detected bounding box in one frame corresponds to a specific student in another.
            </span>
          </div>
        </div>
      )}

      {/* Authorized Teacher Review & Attendance Confirmation Workflow */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--slate-200)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)'
              }}>
                <UserCheck size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                Teacher Review & Attendance Confirmation
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '4px', margin: 0 }}>
              Review the detected headcount against the enrolled student roster and manually sign off on session attendance.
            </p>
          </div>

          {/* Quick Pre-Fill Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const count = activeDetectedCount || students.length;
                const updated: Record<number, 'present' | 'late' | 'absent'> = {};
                students.forEach((stu, i) => {
                  updated[stu.id] = i < count ? 'present' : 'absent';
                });
                setStudentStatuses(updated);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--slate-300)',
                backgroundColor: 'var(--slate-50)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--slate-700)',
                cursor: 'pointer'
              }}
            >
              Fill Present based on Headcount ({activeDetectedCount ?? 0})
            </button>
            <button
              onClick={() => {
                const updated: Record<number, 'present' | 'late' | 'absent'> = {};
                students.forEach((stu) => { updated[stu.id] = 'present'; });
                setStudentStatuses(updated);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--emerald-300)',
                backgroundColor: 'var(--emerald-50)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--emerald-700)',
                cursor: 'pointer'
              }}
            >
              Mark All Present
            </button>
          </div>
        </div>

        {/* Teacher & Session Form Inputs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          padding: '16px',
          backgroundColor: 'var(--slate-50)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--slate-200)'
        }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '6px' }}>
              Target Class Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => onSelectSession(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--slate-300)',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_code} - {s.course_name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '6px' }}>
              Authorized Teacher Signature
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Dr. Sarah Mitchell"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--slate-300)',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Attendance Confirmation Message */}
        {attendanceConfirmationMessage && (
          <div style={{
            backgroundColor: 'var(--emerald-50)',
            border: '1px solid var(--emerald-200)',
            color: 'var(--emerald-800)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={18} color="var(--emerald-600)" />
            <span>{attendanceConfirmationMessage}</span>
          </div>
        )}

        {/* Students Attendance Table */}
        <div style={{ border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--slate-100)', borderBottom: '1px solid var(--slate-200)', color: 'var(--slate-700)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Student</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Student ID</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status Selection</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Teacher Review Note</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const currentStatus = studentStatuses[student.id] || 'absent';
                return (
                  <tr
                    key={student.id}
                    style={{
                      borderBottom: '1px solid var(--slate-200)',
                      backgroundColor: currentStatus === 'present' ? 'rgba(16, 185, 129, 0.03)' : '#ffffff'
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--slate-900)' }}>
                      {student.name}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--slate-500)', fontFamily: 'monospace' }}>
                      {student.student_id}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => setStudentStatuses((prev) => ({ ...prev, [student.id]: 'present' }))}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: currentStatus === 'present' ? '1px solid var(--emerald-600)' : '1px solid var(--slate-300)',
                            backgroundColor: currentStatus === 'present' ? 'var(--emerald-600)' : '#ffffff',
                            color: currentStatus === 'present' ? '#ffffff' : 'var(--slate-700)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => setStudentStatuses((prev) => ({ ...prev, [student.id]: 'late' }))}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: currentStatus === 'late' ? '1px solid var(--amber-600)' : '1px solid var(--slate-300)',
                            backgroundColor: currentStatus === 'late' ? 'var(--amber-600)' : '#ffffff',
                            color: currentStatus === 'late' ? '#ffffff' : 'var(--slate-700)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Late
                        </button>
                        <button
                          onClick={() => setStudentStatuses((prev) => ({ ...prev, [student.id]: 'absent' }))}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: currentStatus === 'absent' ? '1px solid var(--rose-600)' : '1px solid var(--slate-300)',
                            backgroundColor: currentStatus === 'absent' ? 'var(--rose-600)' : '#ffffff',
                            color: currentStatus === 'absent' ? '#ffffff' : 'var(--slate-700)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <input
                        type="text"
                        value={studentNotes[student.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentNotes((prev) => ({ ...prev, [student.id]: val }));
                        }}
                        placeholder="Optional teacher review notes..."
                        style={{
                          width: '90%',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--slate-200)',
                          fontSize: '12px'
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Submit Confirmation CTA */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleConfirmAttendance}
            disabled={isSubmittingAttendance}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--emerald-600)',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 800,
              cursor: isSubmittingAttendance ? 'not-allowed' : 'pointer',
              opacity: isSubmittingAttendance ? 0.7 : 1,
              boxShadow: 'var(--shadow-md)'
            }}
          >
            {isSubmittingAttendance ? (
              <>
                <RotateCcw size={16} className="animate-spin" />
                Signing Attendance Records...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> Confirm & Commit Attendance
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
