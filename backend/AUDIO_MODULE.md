# Classroom Audio Intelligence Module Documentation
**Multimodal Attendance & Engagement Agent**

## 1. Executive Summary & Core Principles

The Classroom Audio Intelligence Module provides acoustic signal telemetry, duration analysis, silence interval extraction, frame-level Root Mean Square (RMS) energy, and Voice Activity Detection (VAD) for educational environments using **Python**, **soundfile**, **NumPy**, and **SciPy**.

### Ethical, Privacy & Scientific Safeguards
1. **Zero Speaker Identification or Voiceprints**: The module does **not** identify individual speakers, generate voice biometric templates, or infer student identities from vocal timbre.
2. **Zero Conversational Transcription**: Speech-to-text transcription of private conversations is strictly disabled by default. The system operates entirely on acoustic presence and signal geometry, not verbal content.
3. **Loudness $\ne$ Engagement**: The platform strictly repudiates the naive fallacy that volume or decibels equate to cognitive engagement. Loudness reflects raw acoustic energy (e.g. background lawnmowers, hall traffic, or clamor). Conversely, low acoustic levels often reflect deep individual reading, quiet attentiveness, or reflective problem-solving.
4. **Administrative Kill-Switch**: Audio processing can be enabled or disabled entirely system-wide via a single administrative toggle (`POST /api/audio/toggle-processing`). When disabled, all audio uploads and microphone streams are completely blocked.
5. **Transient Local Data Sovereignty**: Audio files are decoded in-memory and discarded immediately upon response completion. Any retained audio files can be permanently deleted via dedicated endpoints.

---

## 2. Voice Activity Detection (VAD) & Mathematical Method

The system uses a **Dual-Feature Adaptive Thresholding VAD** that operates out-of-the-box without requiring heavy neural speech-to-text frameworks.

```
[Audio Input (WAV / FLAC / OGG)]
                │
                ▼
      [Decode & Resample]
       - SoundFile / Wave
       - Multichannel to Mono
       - Float32 [-1.0, 1.0]
                │
                ▼
  [Frame Windowing (e.g. 200ms)]
  ┌─────────────────────────────┐
  │ Frame-Level Features:       │
  │ • RMS Energy                │
  │ • Decibel Scaling (dB)      │
  │ • Zero-Crossing Rate (ZCR)  │
  └─────────────────────────────┘
                │
                ▼
  ┌─────────────────────────────┐
  │ Adaptive VAD Classification:│
  │ • Noise Floor (15th %ile)   │
  │ • Dynamic Speech Threshold  │
  │ • Vocal Bandpass Constraint │
  └─────────────────────────────┘
                │
                ▼
  ┌─────────────────────────────┐
  │ Hangover Smoothing:         │
  │ • 3-frame median filter     │
  │ • Silence gap bridging      │
  └─────────────────────────────┘
                │
                ▼
  [Timeline & Participation Metrics]
```

### Mathematical Formulations

#### 1. Frame-Level Root Mean Square (RMS) Energy
For a discrete frame $x = [x_1, x_2, \dots, x_M]$ of length $M$ samples:
$$E_{RMS} = \sqrt{\frac{1}{M}\sum_{i=1}^{M} x_i^2}$$

#### 2. Decibel Full-Scale (dBFS)
$$dB_{RMS} = 20 \log_{10}\left(\max(E_{RMS}, 10^{-6})\right)$$

#### 3. Zero-Crossing Rate (ZCR)
Measures the rate of sign changes along the waveform:
$$ZCR = \frac{1}{2(M-1)} \sum_{i=1}^{M-1} |\text{sgn}(x_{i+1}) - \text{sgn}(x_i)|$$
Human vocal tract acoustic waves typically exhibit $0.018 \le ZCR \le 0.58$. Low-frequency ambient rumble exhibits $ZCR < 0.015$, while high-frequency friction noise exhibits $ZCR > 0.65$.

#### 4. Adaptive Speech Energy Threshold
The background noise floor $E_{noise}$ is estimated from the 15th percentile of all frame RMS values:
$$\theta_{speech} = \max(0.018, E_{noise} \times 2.8)$$

#### 5. Speech Classification Decision Rule
A frame $i$ is initially flagged as active speech if and only if:
$$\text{Speech}_{raw}[i] = (E_{RMS}[i] \ge \theta_{speech}) \;\land\; (0.018 \le ZCR[i] \le 0.58)$$

#### 6. Hangover Median Filter
To bridge short inter-syllabic breath stops and consonant transitions, a sliding 3-frame (~600ms) hangover filter is applied:
$$\text{Speech}_{smoothed}[i] = \mathbb{I}\left(\sum_{k=i-1}^{i+1} \text{Speech}_{raw}[k] \ge 2\right)$$

#### 7. Silence Reflection Intervals
Contiguous blocks of non-speech frames where $E_{RMS} < \theta_{speech}$ persisting for $\ge 0.40\text{s}$ are isolated and tagged as pedagogical reflection intervals.

---

## 3. Optional Voice Activity Detection Models

If higher-order neural VAD is desired, the architecture supports dropping in optional pretrained neural models:

### A. Silero VAD (ONNX Runtime)
- **Model**: `silero_vad.onnx` (Compact 2MB RNN/CNN model)
- **Installation**:
  ```bash
  pip install onnxruntime
  # Place silero_vad.onnx into backend/models/weights/
  ```
- **Capabilities**: Highly robust to extreme classroom reverberation and background air conditioning.

### B. WebRTC VAD
- **Package**: `webrtcvad`
- **Installation**:
  ```bash
  pip install webrtcvad
  ```
- **Requirements**: Requires audio input at 8kHz, 16kHz, 32kHz, or 48kHz with 10ms, 20ms, or 30ms frames.

---

## 4. API Endpoints

### 1. `GET /api/audio/status`
Returns current processing status, available audio libraries, and privacy guarantees.

**Response:**
```json
{
  "audio_processing_enabled": true,
  "active_engine": "soundfile + numpy",
  "installed_libraries": {
    "soundfile": true,
    "numpy": true,
    "scipy": true,
    "librosa": false,
    "wave_standard_lib": true
  },
  "privacy_guarantees": {
    "speaker_identification": "strictly_disabled",
    "speech_transcription": "strictly_disabled",
    "loudness_claim": "loudness_does_not_equal_engagement"
  },
  "supported_formats": [".wav", ".ogg", ".flac"],
  "max_file_size_mb": 25,
  "vad_method_documentation": "Dual-feature adaptive Voice Activity Detection..."
}
```

### 2. `POST /api/audio/toggle-processing`
Administrative master kill-switch to enable or disable audio processing system-wide.

**Request:**
```json
{
  "enabled": false
}
```

**Response:**
```json
{
  "success": true,
  "audio_processing_enabled": false,
  "message": "Audio processing disabled system-wide."
}
```

### 3. `POST /api/audio/analyze-wav`
Decodes an uploaded local WAV audio file.

**Form Data:**
- `file`: WAV binary (multipart/form-data)
- `demo_mode`: `true` | `false`
- `frame_interval_seconds`: `0.20` (default)
- `retain_audio`: `true` | `false`

**Response:**
```json
{
  "audio_metadata": {
    "duration_seconds": 30.0,
    "sample_rate_hz": 16000,
    "total_samples": 480000,
    "channels": 1,
    "frame_duration_seconds": 0.20,
    "total_frames_sampled": 150
  },
  "duration_seconds": 30.0,
  "speech_duration_seconds": 18.4,
  "silence_duration_seconds": 11.6,
  "speech_ratio_percentage": 61.3,
  "silence_ratio_percentage": 38.7,
  "average_rms_energy": 0.0821,
  "peak_rms_energy": 0.2140,
  "vocal_participation_index": 0.88,
  "acoustic_environment": "active_discussion",
  "dialogue_turns_estimated": 5,
  "silence_intervals": [
    { "start_seconds": 10.0, "end_seconds": 15.0, "duration_seconds": 5.0 }
  ],
  "timeline": [
    {
      "time_seconds": 0.0,
      "timestamp_formatted": "00:00.00",
      "rms_energy": 0.092,
      "rms_db": -20.7,
      "zcr": 0.184,
      "speech_active": true
    }
  ],
  "analysis_engine": "soundfile + numpy",
  "is_simulated": false,
  "processing_time_ms": 34.2,
  "retained_file_id": null,
  "disclaimer": "Loudness reflects acoustic energy and must never be equated to student engagement. Zero speaker identification or voice biometrics performed."
}
```

### 4. `DELETE /api/audio/files/{file_id}` & `DELETE /api/audio/files`
Purges locally retained audio files.

---

## 5. Session-Level Participation Metrics

| Indicator | Measurement | Pedagogical Meaning |
|---|---|---|
| **Vocal Participation Index** | $0.0 - 1.0$ (Percentage) | Measures the interactive balance of the session. Standard lectures are typically $15\% - 35\%$; collaborative sessions $35\% - 65\%$. |
| **Dialogue Turns Estimated** | Integer count | Counts vocal transitions between discourse and reflection pauses. |
| **Silence Ratio** | Percentage | Identifies reflection windows, individual work, or writing phases. |
| **Acoustic Environment** | Categorical | Classifies atmosphere into `quiet_attentive_lecture`, `active_discussion`, `collaborative_group_work`, or `elevated_ambient_noise`. |

---

## 6. Technical Limitations & Operational Boundaries

1. **Reverberant Lecture Halls**: Large concrete or tile lecture halls induce reverberant sound decay that can artificially lengthen perceived speech activity frames. The adaptive noise floor mitigates this by elevating the speech threshold dynamically.
2. **Directional Microphones**: If audio is captured via a single lapel microphone worn by the instructor, student questions may fall below the speech threshold. In such setups, the participation index primarily reflects instructor pacing rather than cohort dialogue.
3. **No Speaker Diarization**: Because individual voice biometrics and speaker identification are strictly disabled, the system cannot report which specific student spoke during a discussion burst.
