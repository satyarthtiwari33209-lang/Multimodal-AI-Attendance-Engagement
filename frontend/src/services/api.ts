import type {
  Student,
  ClassSession,
  AttendanceRecord,
  SessionTrends,
  AgentInsight,
  DashboardOverview,
  StudentLeaderboardItem,
  FrameProcessResponse,
  VisionModelStatus,
  ImageDetectionResponse,
  VideoDetectionResponse,
  TeacherConfirmAttendanceRequest,
  TeacherConfirmAttendanceResponse,
  AudioAnalysisResponse,
  AudioStatusResponse,
  AudioToggleResponse,
  RecommendationItem,
  GenerateRecommendationsResponse,
  ReasoningRuleDocumentation
} from '../types';

const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
};

const RAW_API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.VITE_BACKEND_URL as string | undefined) ||
  getDefaultApiUrl();

// Strip any trailing slash to prevent malformed double-slash API routes (e.g., https://api.render.com//api/health)
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) detail = parsed.detail;
    } catch {}
    throw new Error(`API Error ${response.status}: ${detail || response.statusText}`);
  }

  return response.json();
}

async function uploadFormData<T>(url: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) detail = parsed.detail;
    } catch {}
    throw new Error(`API Error ${response.status}: ${detail || response.statusText}`);
  }

  return response.json();
}

export const api = {
  // System Health
  getHealth: () => fetchJson<{ status: string; database: string; enrolled_students: number }>('/api/health'),

  // Analytics Overview
  getOverview: () => fetchJson<DashboardOverview>('/api/analytics/overview'),

  // Sessions
  getSessions: () => fetchJson<ClassSession[]>('/api/sessions'),
  getSession: (id: number) => fetchJson<ClassSession>(`/api/sessions/${id}`),
  createSession: (data: { session_code: string; course_name: string; instructor?: string; room?: string; topic?: string }) =>
    fetchJson<ClassSession>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  startSession: (id: number) =>
    fetchJson<{ success: boolean; status: string }>(`/api/sessions/${id}/start`, { method: 'POST' }),
  stopSession: (id: number) =>
    fetchJson<{ success: boolean; status: string }>(`/api/sessions/${id}/stop`, { method: 'POST' }),

  // Session Trends & Charts
  getSessionTrends: (sessionId: number) =>
    fetchJson<SessionTrends>(`/api/analytics/session/${sessionId}/trends`),

  // Attendance
  getSessionAttendance: (sessionId: number) =>
    fetchJson<AttendanceRecord[]>(`/api/attendance/${sessionId}`),
  markAttendance: (data: {
    session_id: number;
    student_id: number;
    status: 'present' | 'late' | 'absent';
    verification_method?: string;
    confidence_score?: number;
    notes?: string;
  }) =>
    fetchJson<AttendanceRecord>('/api/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  batchVerifyAttendance: (data: { session_id: number; student_ids: number[]; status: string; verification_method: string }) =>
    fetchJson<{ success: boolean; records_processed: number }>('/api/attendance/batch-verify', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAttendanceRecord: (recordId: number, data: { status?: string; notes?: string }) =>
    fetchJson<AttendanceRecord>(`/api/attendance/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Students
  getStudents: () => fetchJson<Student[]>('/api/students'),
  createStudent: (data: { student_id: string; name: string; email: string; department?: string; enrolled_courses?: string }) =>
    fetchJson<Student>('/api/students', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  enrollFaceBiometrics: (studentId: number, imageBase64: string) =>
    fetchJson<{ success: boolean; message: string; features_extracted: number }>(`/api/students/${studentId}/enroll-face`, {
      method: 'POST',
      body: JSON.stringify({ student_id: studentId, image_base64: imageBase64 })
    }),
  getLeaderboard: () => fetchJson<StudentLeaderboardItem[]>('/api/analytics/leaderboard'),

  // Multimodal Frame & Audio Processing (Core Ingestion)
  processMultimodalFrame: (data: {
    session_id: number;
    image_base64?: string | null;
    audio_level?: number;
    mark_attendance_if_matched?: boolean;
    simulate_multi_student?: boolean;
  }) =>
    fetchJson<FrameProcessResponse>('/api/multimodal/process-frame', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getLiveMetrics: (sessionId: number) =>
    fetchJson<{
      session_id: number;
      active_stream: boolean;
      cohort_engagement: number;
      recent_faces_count: number;
      speech_active: boolean;
      latest_emotion: string;
    }>(`/api/multimodal/live-metrics/${sessionId}`),

  // AI Agent Insights & Interventions
  getInsights: (sessionId: number) => fetchJson<AgentInsight[]>(`/api/insights/${sessionId}`),
  generateInsights: (sessionId: number) =>
    fetchJson<{ success: boolean; session_id: number; generated_count: number; insights: any[] }>(
      `/api/insights/generate/${sessionId}`,
      { method: 'POST' }
    ),
  resolveInsight: (insightId: number, resolutionNote: string) =>
    fetchJson<AgentInsight>(`/api/insights/${insightId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution_note: resolutionNote })
    }),

  // System Administration
  resetDemoData: () =>
    fetchJson<{ success: boolean; message: string; status: string }>('/api/system/reset-demo-data', {
      method: 'POST'
    }),

  // ==========================================
  // Classroom Vision & Teacher Attendance Module
  // ==========================================
  getVisionModelStatus: () => fetchJson<VisionModelStatus>('/api/vision/model-status'),

  detectImage: (file: File, demoMode = false, retainMedia = false) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('demo_mode', String(demoMode));
    fd.append('retain_media', String(retainMedia));
    return uploadFormData<ImageDetectionResponse>('/api/vision/detect-image', fd);
  },

  detectVideo: (file: File, sampleRateSeconds = 1.0, demoMode = false, retainMedia = false) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('sample_rate_seconds', String(sampleRateSeconds));
    fd.append('demo_mode', String(demoMode));
    fd.append('retain_media', String(retainMedia));
    return uploadFormData<VideoDetectionResponse>('/api/vision/detect-video', fd);
  },

  confirmTeacherAttendance: (data: TeacherConfirmAttendanceRequest) =>
    fetchJson<TeacherConfirmAttendanceResponse>('/api/vision/confirm-attendance', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteRetainedFile: (fileId: string) =>
    fetchJson<{ success: boolean; message: string }>(`/api/vision/files/${fileId}`, {
      method: 'DELETE'
    }),

  clearAllRetainedFiles: () =>
    fetchJson<{ success: boolean; files_deleted: number }>('/api/vision/files', {
      method: 'DELETE'
    }),

  // ==========================================
  // Audio Intelligence Module
  // ==========================================
  getAudioStatus: () => fetchJson<AudioStatusResponse>('/api/audio/status'),

  toggleAudioProcessing: (enabled: boolean) =>
    fetchJson<AudioToggleResponse>('/api/audio/toggle-processing', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    }),

  analyzeWav: (file: File, demoMode = false, frameIntervalSeconds = 0.20, retainAudio = false) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('demo_mode', String(demoMode));
    fd.append('frame_interval_seconds', String(frameIntervalSeconds));
    fd.append('retain_audio', String(retainAudio));
    return uploadFormData<AudioAnalysisResponse>('/api/audio/analyze-wav', fd);
  },

  deleteRetainedAudioFile: (fileId: string) =>
    fetchJson<{ success: boolean; message: string }>(`/api/audio/files/${fileId}`, {
      method: 'DELETE'
    }),

  clearAllRetainedAudioFiles: () =>
    fetchJson<{ success: boolean; files_deleted: number }>('/api/audio/files', {
      method: 'DELETE'
    }),

  // ==========================================
  // Deterministic Recommendation Agent
  // ==========================================
  getReasoningRules: () =>
    fetchJson<ReasoningRuleDocumentation[]>('/api/recommendations/rules'),

  getSessionRecommendations: (sessionId: number) =>
    fetchJson<GenerateRecommendationsResponse>(`/api/recommendations/session/${sessionId}`),

  generateRecommendations: (sessionId: number) =>
    fetchJson<GenerateRecommendationsResponse>(`/api/recommendations/generate/${sessionId}`, {
      method: 'POST'
    }),

  applyRecommendation: (recommendationId: number, feedback?: string) =>
    fetchJson<RecommendationItem>(`/api/recommendations/${recommendationId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ feedback: feedback || 'Implemented during instructional delivery' })
    }),

  dismissRecommendation: (recommendationId: number, feedback?: string) =>
    fetchJson<RecommendationItem>(`/api/recommendations/${recommendationId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ feedback: feedback || 'Acknowledged / deliberate instructional choice' })
    })
};


