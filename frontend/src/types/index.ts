export interface Student {
  id: number;
  student_id: string;
  name: string;
  email: string;
  department: string;
  avatar_url?: string;
  enrolled_courses: string;
  biometric_face_registered: boolean;
  created_at: string;
}

export interface ClassSession {
  id: number;
  session_code: string;
  course_name: string;
  instructor: string;
  room: string;
  topic: string;
  status: 'scheduled' | 'live' | 'completed';
  start_time: string;
  end_time?: string;
  created_at: string;
  attendance_count?: number;
  average_engagement?: number;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  student_name: string;
  student_code: string;
  student_avatar?: string;
  timestamp: string;
  status: 'present' | 'late' | 'absent';
  verification_method: 'biometric_face' | 'manual' | 'qr_beacon';
  confidence_score: number;
  notes?: string;
}

export interface TimelinePoint {
  minute: string;
  time: string;
  attention: number;
  audio_energy: number;
  engagement: number;
  drowsiness_count: number;
  emotion?: string;
}

export interface SessionTrends {
  session_id: number;
  timeline: TimelinePoint[];
  overall_score: number;
  log_count?: number;
}

export interface AgentInsight {
  id: number;
  session_id: number;
  timestamp: string;
  type: 'alert' | 'intervention' | 'praise' | 'strategy';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  target_student_id?: number;
  target_student_name?: string;
  is_resolved: boolean;
  resolution_note?: string;
}

export interface DashboardOverview {
  total_students: number;
  total_sessions: number;
  live_session_id?: number;
  live_session_title?: string;
  attendance_rate: number;
  average_engagement: number;
  active_alerts_count: number;
  system_status: string;
}

export interface StudentLeaderboardItem {
  id: number;
  student_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  department: string;
  attendance_rate: number;
  engagement_score: number;
  biometric_registered: boolean;
}

export interface MultimodalAudioMetrics {
  rms_volume: number;
  speech_detected: boolean;
  spectral_energy: number;
  acoustic_environment: string;
}

export interface RecognizedStudentInFrame {
  student_id: number;
  student_name: string;
  confidence: number;
  gaze: 'center' | 'left' | 'right' | 'down' | 'away';
  drowsiness: boolean;
  emotion: 'focused' | 'neutral' | 'confused' | 'distracted' | 'bored';
  attention: number;
  engagement: number;
  head_pose: { pitch: number; yaw: number; roll: number };
}

export interface FrameProcessResponse {
  session_id: number;
  timestamp: string;
  faces_detected: number;
  students_recognized: RecognizedStudentInFrame[];
  audio_metrics: MultimodalAudioMetrics;
  cohort_engagement_score: number;
  active_alerts: string[];
  immediate_recommendation?: string;
}

// ==========================================
// Classroom Vision Module (Headcount & OpenCV)
// ==========================================

export interface VisionBoundingBox {
  box: [number, number, number, number]; // [x, y, width, height]
  confidence: number;
  label: string;
}

export interface VisionModelStatus {
  active_detector: string;
  has_custom_weights: boolean;
  weights_directory: string;
  files_in_weights_dir: string[];
  opencv_version: string;
  biometrics_enabled: boolean;
  facial_recognition: string;
  supported_models: string[];
  demo_mode_available: boolean;
}

export interface ImageDetectionResponse {
  person_count: number;
  bounding_boxes: VisionBoundingBox[];
  image_width: number;
  image_height: number;
  detection_source: string;
  is_simulated: boolean;
  confidence_average: number;
  processing_time_ms: number;
  retained_file_id?: string | null;
  disclaimer: string;
}

export interface VideoFrameDetection {
  frame_index: number;
  timestamp_ms: number;
  timestamp_formatted: string;
  person_count: number;
  bounding_boxes: VisionBoundingBox[];
}

export interface VideoDetectionResponse {
  video_metadata: {
    duration_seconds: number;
    fps: number;
    resolution: string;
    total_frames_in_video: number;
  };
  total_frames_sampled: number;
  sampling_interval_seconds: number;
  average_person_count: number;
  peak_person_count: number;
  min_person_count: number;
  frame_timeline: VideoFrameDetection[];
  detection_source: string;
  is_simulated: boolean;
  processing_time_ms: number;
  retained_file_id?: string | null;
  disclaimer: string;
}

export interface TeacherConfirmAttendanceItem {
  student_id: number;
  status: 'present' | 'late' | 'absent';
  notes?: string;
}

export interface TeacherConfirmAttendanceRequest {
  session_id: number;
  detection_source_type: 'image' | 'video';
  detected_headcount: number;
  authorized_teacher_name: string;
  confirmations: TeacherConfirmAttendanceItem[];
}

export interface TeacherConfirmAttendanceResponse {
  success: boolean;
  session_id: number;
  confirmed_count: number;
  message: string;
  timestamp: string;
}

// ==========================================
// Audio Intelligence Module
// ==========================================

export interface AudioFrameMetric {
  time_seconds: number;
  timestamp_formatted: string;
  rms_energy: number;
  rms_db: number;
  zcr: number;
  speech_active: boolean;
}

export interface SilenceInterval {
  start_seconds: number;
  end_seconds: number;
  duration_seconds: number;
}

export interface AudioAnalysisResponse {
  audio_metadata: {
    duration_seconds: number;
    sample_rate_hz: number;
    total_samples: number;
    channels: number;
    frame_duration_seconds: number;
    total_frames_sampled: number;
  };
  duration_seconds: number;
  speech_duration_seconds: number;
  silence_duration_seconds: number;
  speech_ratio_percentage: number;
  silence_ratio_percentage: number;
  average_rms_energy: number;
  peak_rms_energy: number;
  vocal_participation_index: number;
  acoustic_environment: string;
  dialogue_turns_estimated: number;
  silence_intervals: SilenceInterval[];
  timeline: AudioFrameMetric[];
  analysis_engine: string;
  is_simulated: boolean;
  processing_time_ms: number;
  retained_file_id?: string | null;
  privacy_guarantees: Record<string, string>;
  disclaimer: string;
}

export interface AudioStatusResponse {
  audio_processing_enabled: boolean;
  active_engine: string;
  installed_libraries: Record<string, boolean>;
  privacy_guarantees: Record<string, string>;
  supported_formats: string[];
  max_file_size_mb: number;
  vad_method_documentation: string;
}

export interface AudioToggleResponse {
  success: boolean;
  audio_processing_enabled: boolean;
  message: string;
}

// ==========================================
// Deterministic Rule-Based Recommendation Agent
// ==========================================

export interface RecommendationItem {
  id: number;
  session_id: number;
  timestamp: string;
  rule_id: string;
  rule_name: string;
  category: string;
  item_type: 'OBSERVED_MEASUREMENT' | 'STATISTICAL_ESTIMATE' | 'PEDAGOGICAL_RECOMMENDATION';
  title: string;
  suggestion: string;
  pedagogical_rationale: string;
  supporting_signals: string[];
  confidence_score: number;
  confidence_limitations: string;
  severity: 'low' | 'medium' | 'high';
  is_applied: boolean;
  teacher_feedback?: string | null;
}

export interface SessionSummaryResponse {
  id: number;
  session_id: number;
  timestamp: string;
  enrolled_student_count: number;
  confirmed_attendance_count: number;
  attendance_rate: number;
  attendance_change_from_prior?: number | null;
  vision_headcount_peak?: number | null;
  speech_ratio?: number | null;
  silence_ratio?: number | null;
  silence_intervals_count?: number | null;
  vocal_participation_index?: number | null;
  dialogue_turns_estimated?: number | null;
  acoustic_environment?: string | null;
  active_modalities: string[];
  missing_modalities: string[];
  epistemological_disclaimer: string;
}

export interface GenerateRecommendationsResponse {
  success: boolean;
  session_id: number;
  summary: SessionSummaryResponse;
  recommendations: RecommendationItem[];
  observed_measurements_count: number;
  statistical_estimates_count: number;
  pedagogical_recommendations_count: number;
  epistemological_notice: string;
}

export interface ReasoningRuleDocumentation {
  rule_id: string;
  rule_name: string;
  category: string;
  trigger_condition: string;
  pedagogical_rationale: string;
  suggested_action: string;
  required_modalities: string[];
}



