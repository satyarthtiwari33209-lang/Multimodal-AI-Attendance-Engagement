import io
import math
import time
import wave
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

# Optional audio libraries handling
SOUNDFILE_AVAILABLE = False
SCIPY_AVAILABLE = False
LIBROSA_AVAILABLE = False

try:
    import soundfile as sf
    SOUNDFILE_AVAILABLE = True
except ImportError:
    sf = None

try:
    import scipy.signal
    SCIPY_AVAILABLE = True
except ImportError:
    pass

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    pass

# Temp uploads directory for optional retained audio
TEMP_AUDIO_DIR = Path(__file__).resolve().parent.parent / "uploads" / "audio" / "temp"
TEMP_AUDIO_DIR.mkdir(parents=True, exist_ok=True)

class ClassroomAudioIntelligence:
    """
    Audio Intelligence & Telemetry Processing Module for Education Analytics.
    
    Adheres strictly to the following ethical and scientific boundaries:
    1. Zero speaker identification or voice biometrics.
    2. Zero conversational transcription / speech-to-text eavesdropping.
    3. Strictly repudiates the fallacy that loudness equals student engagement
       (loudness reflects acoustic volume, which may be background noise or clapping).
    4. Provides complete capability to disable audio processing entirely.
    5. Local file processing: Media is processed in-memory and discarded by default.
    6. Documented Voice Activity Detection (VAD) using dual-feature energy & ZCR thresholding.
    7. Gracefully handles missing optional libraries (soundfile, scipy, librosa).
    """

    def __init__(self):
        self.audio_processing_enabled = True
        self.min_speech_threshold = 0.018
        self.min_silence_duration_seconds = 0.40

    def is_enabled(self) -> bool:
        return self.audio_processing_enabled

    def set_enabled(self, enabled: bool) -> bool:
        self.audio_processing_enabled = enabled
        return self.audio_processing_enabled

    def get_status(self) -> Dict[str, Any]:
        """Returns the current audio processing status, libraries, and privacy declarations."""
        active_engine = "soundfile + numpy" if SOUNDFILE_AVAILABLE else "python_wave + numpy (fallback)"
        return {
            "audio_processing_enabled": self.audio_processing_enabled,
            "active_engine": active_engine,
            "installed_libraries": {
                "soundfile": SOUNDFILE_AVAILABLE,
                "numpy": True,
                "scipy": SCIPY_AVAILABLE,
                "librosa": LIBROSA_AVAILABLE,
                "wave_standard_lib": True
            },
            "privacy_guarantees": {
                "speaker_identification": "strictly_disabled",
                "identity_inference": "strictly_disabled",
                "speech_transcription": "strictly_disabled",
                "biometric_voiceprints": "strictly_disabled",
                "data_residency": "local_only_transient_by_default",
                "loudness_claim": "loudness_does_not_equal_engagement"
            },
            "supported_formats": [".wav", ".ogg", ".flac"] if SOUNDFILE_AVAILABLE else [".wav"],
            "max_file_size_mb": 25,
            "vad_method_documentation": (
                "Dual-feature adaptive Voice Activity Detection: "
                "1. Root Mean Square (RMS) energy thresholded against adaptive noise floor. "
                "2. Zero-Crossing Rate (ZCR) bandpass constraint (0.02 <= ZCR <= 0.55). "
                "3. Hangover median temporal smoothing (300ms) to bridge syllable gaps."
            )
        }

    def decode_audio_bytes(self, audio_bytes: bytes) -> Tuple[np.ndarray, int]:
        """
        Decodes raw audio bytes into a float32 mono numpy array in range [-1.0, 1.0].
        Uses soundfile if available, with graceful fallback to standard library wave.
        """
        # Strategy 1: soundfile (handles WAV, FLAC, OGG, etc.)
        if SOUNDFILE_AVAILABLE:
            try:
                data, sample_rate = sf.read(io.BytesIO(audio_bytes), dtype="float32")
                # If stereo/multichannel, average to mono
                if data.ndim > 1:
                    data = np.mean(data, axis=1)
                return data, int(sample_rate)
            except Exception as sf_err:
                # If soundfile fails, fall through to wave fallback
                pass

        # Strategy 2: Python standard library 'wave' module
        try:
            with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
                sample_rate = wf.getframerate()
                num_channels = wf.getnchannels()
                sample_width = wf.getsampwidth()
                num_frames = wf.getnframes()
                raw_frames = wf.readframes(num_frames)

                if sample_width == 1:
                    data = (np.frombuffer(raw_frames, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
                elif sample_width == 2:
                    data = np.frombuffer(raw_frames, dtype=np.int16).astype(np.float32) / 32768.0
                elif sample_width == 4:
                    data = np.frombuffer(raw_frames, dtype=np.int32).astype(np.float32) / 2147483648.0
                else:
                    raise ValueError(f"Unsupported WAV sample width: {sample_width} bytes")

                if num_channels > 1:
                    data = data.reshape(-1, num_channels)
                    data = np.mean(data, axis=1)

                return data, int(sample_rate)
        except Exception as wave_err:
            raise ValueError(f"Failed to decode audio file. Please provide a valid WAV audio file. ({wave_err})")

    def analyze_audio(
        self,
        audio_bytes: bytes,
        demo_mode: bool = False,
        frame_duration_seconds: float = 0.20
    ) -> Dict[str, Any]:
        """
        Executes full audio intelligence pipeline on audio buffer:
        - Total duration
        - Frame-level RMS energy and dB
        - Zero-Crossing Rate (ZCR)
        - Adaptive Voice Activity Detection (VAD)
        - Silence intervals
        - Session-level participation indicators
        """
        start_time = time.time()

        if demo_mode:
            return self._generate_synthetic_demo_analysis(start_time)

        if not self.audio_processing_enabled:
            raise PermissionError("Audio processing has been explicitly disabled by administrative policy.")

        # 1. Decode audio
        data, sample_rate = self.decode_audio_bytes(audio_bytes)
        total_samples = len(data)
        if total_samples == 0:
            raise ValueError("Audio file contains zero samples.")

        duration_seconds = round(float(total_samples) / float(sample_rate), 3)

        # 2. Windowing parameters
        frame_len = max(1, int(sample_rate * frame_duration_seconds))
        num_frames = total_samples // frame_len

        # If audio is very short, adapt frame length
        if num_frames == 0:
            frame_len = total_samples
            num_frames = 1

        # 3. Calculate frame-level RMS Energy & ZCR
        timeline: List[Dict[str, Any]] = []
        raw_rms_values: List[float] = []

        for i in range(num_frames):
            start_idx = i * frame_len
            end_idx = min(total_samples, start_idx + frame_len)
            frame_data = data[start_idx:end_idx]

            # RMS Energy: sqrt(mean(x^2))
            mean_sq = float(np.mean(frame_data ** 2)) if len(frame_data) > 0 else 0.0
            rms = math.sqrt(mean_sq)
            raw_rms_values.append(rms)

            # RMS in Decibels (clamped)
            rms_db = round(20.0 * math.log10(max(rms, 1e-6)), 1)

            # Zero-Crossing Rate (ZCR)
            if len(frame_data) > 1:
                signs = np.sign(frame_data)
                signs[signs == 0] = 1
                crossings = np.sum(np.abs(np.diff(signs))) / (2.0 * (len(frame_data) - 1))
            else:
                crossings = 0.0

            time_s = round(float(start_idx) / float(sample_rate), 2)
            mins = int(time_s // 60)
            secs = time_s % 60
            ts_formatted = f"{mins:02d}:{secs:05.2f}"

            timeline.append({
                "time_seconds": time_s,
                "timestamp_formatted": ts_formatted,
                "rms_energy": round(rms, 4),
                "rms_db": rms_db,
                "zcr": round(float(crossings), 4),
                "speech_active": False  # Evaluated in VAD pass below
            })

        # 4. Adaptive Voice Activity Detection (VAD)
        # Calculate background noise floor (15th percentile of RMS)
        noise_floor = float(np.percentile(raw_rms_values, 15)) if raw_rms_values else 0.005
        speech_thresh = max(self.min_speech_threshold, noise_floor * 2.8)

        raw_speech_flags = []
        for i, item in enumerate(timeline):
            rms_val = item["rms_energy"]
            zcr_val = item["zcr"]
            # Speech heuristic: Energy exceeds adaptive threshold AND ZCR within human vocal band
            is_speech = (rms_val >= speech_thresh) and (0.018 <= zcr_val <= 0.58)
            raw_speech_flags.append(is_speech)

        # Hangover smoothing filter (window of 3 frames ~ 600ms) to bridge syllable gaps
        smoothed_speech_flags = []
        for i in range(len(raw_speech_flags)):
            w_start = max(0, i - 1)
            w_end = min(len(raw_speech_flags), i + 2)
            sub = raw_speech_flags[w_start:w_end]
            # If 2 out of 3 frames are speech, mark as speech
            smoothed_speech_flags.append(sum(sub) >= 2)

        for i, flag in enumerate(smoothed_speech_flags):
            timeline[i]["speech_active"] = bool(flag)

        # 5. Extract Silence Intervals
        silence_intervals: List[Dict[str, float]] = []
        in_silence = False
        silence_start = 0.0

        for item in timeline:
            if not item["speech_active"]:
                if not in_silence:
                    in_silence = True
                    silence_start = item["time_seconds"]
            else:
                if in_silence:
                    in_silence = False
                    silence_dur = item["time_seconds"] - silence_start
                    if silence_dur >= self.min_silence_duration_seconds:
                        silence_intervals.append({
                            "start_seconds": round(silence_start, 2),
                            "end_seconds": round(item["time_seconds"], 2),
                            "duration_seconds": round(silence_dur, 2)
                        })

        if in_silence:
            final_silence_dur = duration_seconds - silence_start
            if final_silence_dur >= self.min_silence_duration_seconds:
                silence_intervals.append({
                    "start_seconds": round(silence_start, 2),
                    "end_seconds": round(duration_seconds, 2),
                    "duration_seconds": round(final_silence_dur, 2)
                })

        # 6. Aggregate Session Indicators
        speech_frames_count = sum(1 for item in timeline if item["speech_active"])
        total_frames_count = len(timeline)
        speech_ratio = (speech_frames_count / total_frames_count) if total_frames_count > 0 else 0.0
        speech_duration_s = round(speech_ratio * duration_seconds, 2)
        silence_duration_s = round(duration_seconds - speech_duration_s, 2)

        avg_rms = round(float(np.mean(raw_rms_values)), 4) if raw_rms_values else 0.0
        peak_rms = round(float(np.max(raw_rms_values)), 4) if raw_rms_values else 0.0

        # Vocal Participation Index (0.0 to 1.0)
        # 30% - 60% active dialogue is ideal in an interactive session
        if 0.25 <= speech_ratio <= 0.65:
            participation_index = round(0.85 + (speech_ratio - 0.25) * 0.25, 2)
        elif speech_ratio < 0.25:
            participation_index = round(max(0.20, speech_ratio * 3.2), 2)
        else:
            participation_index = round(max(0.60, 1.0 - (speech_ratio - 0.65) * 0.8), 2)

        # Classroom Acoustic Environment Classification
        if avg_rms < 0.025 and speech_ratio < 0.15:
            environment = "quiet_attentive_lecture"
        elif speech_ratio <= 0.45:
            environment = "active_discussion"
        elif speech_ratio <= 0.75:
            environment = "collaborative_group_work"
        else:
            environment = "elevated_ambient_noise"

        # Dialogue Turns Estimation (Count speech bursts)
        dialogue_turns = 0
        prev_speech = False
        for flag in smoothed_speech_flags:
            if flag and not prev_speech:
                dialogue_turns += 1
            prev_speech = flag

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "audio_metadata": {
                "duration_seconds": duration_seconds,
                "sample_rate_hz": sample_rate,
                "total_samples": total_samples,
                "channels": 1,
                "frame_duration_seconds": frame_duration_seconds,
                "total_frames_sampled": len(timeline)
            },
            "duration_seconds": duration_seconds,
            "speech_duration_seconds": speech_duration_s,
            "silence_duration_seconds": silence_duration_s,
            "speech_ratio_percentage": round(speech_ratio * 100.0, 1),
            "silence_ratio_percentage": round((1.0 - speech_ratio) * 100.0, 1),
            "average_rms_energy": avg_rms,
            "peak_rms_energy": peak_rms,
            "vocal_participation_index": min(1.0, max(0.0, participation_index)),
            "acoustic_environment": environment,
            "dialogue_turns_estimated": dialogue_turns,
            "silence_intervals": silence_intervals,
            "timeline": timeline,
            "analysis_engine": "soundfile + numpy" if SOUNDFILE_AVAILABLE else "python_wave + numpy",
            "is_simulated": False,
            "processing_time_ms": elapsed_ms,
            "privacy_guarantees": {
                "speaker_identification": "disabled",
                "speech_transcription": "disabled",
                "biometrics": "none"
            },
            "disclaimer": (
                "Loudness reflects acoustic energy and must never be equated to student engagement. "
                "Low volume may indicate focused individual reading. No voice biometrics or transcriptions were performed."
            )
        }

    def _generate_synthetic_demo_analysis(self, start_time: float) -> Dict[str, Any]:
        """Generates realistic synthetic 30-second classroom acoustic metrics for demo mode."""
        duration_s = 30.0
        frame_interval = 0.50
        num_frames = int(duration_s / frame_interval)
        
        timeline = []
        raw_rms = []

        # Synthetic pattern:
        # 0s - 10s: Teacher lecture (moderate energy, speech active)
        # 10s - 15s: Silence interval (pause for question)
        # 15s - 22s: Student response (active dialogue)
        # 22s - 26s: Brief pause
        # 26s - 30s: Teacher wrap-up
        for i in range(num_frames):
            t = round(i * frame_interval, 2)
            mins = int(t // 60)
            secs = t % 60
            ts_formatted = f"{mins:02d}:{secs:05.2f}"

            if 0.0 <= t < 10.0:
                rms = round(0.12 + 0.03 * math.sin(t * 1.5), 4)
                zcr = round(0.18 + 0.04 * math.cos(t), 4)
                speech = True
            elif 10.0 <= t < 15.0:
                rms = round(0.008 + 0.003 * math.sin(t), 4)
                zcr = 0.04
                speech = False
            elif 15.0 <= t < 22.0:
                rms = round(0.09 + 0.04 * math.sin(t * 2.2), 4)
                zcr = round(0.22 + 0.05 * math.sin(t), 4)
                speech = True
            elif 22.0 <= t < 25.5:
                rms = 0.009
                zcr = 0.03
                speech = False
            else:
                rms = round(0.11 + 0.02 * math.cos(t), 4)
                zcr = 0.16
                speech = True

            raw_rms.append(rms)
            rms_db = round(20.0 * math.log10(max(rms, 1e-6)), 1)

            timeline.append({
                "time_seconds": t,
                "timestamp_formatted": ts_formatted,
                "rms_energy": rms,
                "rms_db": rms_db,
                "zcr": zcr,
                "speech_active": speech
            })

        speech_count = sum(1 for item in timeline if item["speech_active"])
        speech_ratio = speech_count / len(timeline)
        speech_dur = round(speech_ratio * duration_s, 2)
        silence_dur = round(duration_s - speech_dur, 2)

        silence_intervals = [
            {"start_seconds": 10.0, "end_seconds": 15.0, "duration_seconds": 5.0},
            {"start_seconds": 22.0, "end_seconds": 25.5, "duration_seconds": 3.5}
        ]

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "audio_metadata": {
                "duration_seconds": duration_s,
                "sample_rate_hz": 16000,
                "total_samples": 480000,
                "channels": 1,
                "frame_duration_seconds": frame_interval,
                "total_frames_sampled": len(timeline)
            },
            "duration_seconds": duration_s,
            "speech_duration_seconds": speech_dur,
            "silence_duration_seconds": silence_dur,
            "speech_ratio_percentage": round(speech_ratio * 100.0, 1),
            "silence_ratio_percentage": round((1.0 - speech_ratio) * 100.0, 1),
            "average_rms_energy": round(float(np.mean(raw_rms)), 4),
            "peak_rms_energy": round(float(np.max(raw_rms)), 4),
            "vocal_participation_index": 0.88,
            "acoustic_environment": "active_discussion",
            "dialogue_turns_estimated": 3,
            "silence_intervals": silence_intervals,
            "timeline": timeline,
            "analysis_engine": "demo_simulation",
            "is_simulated": True,
            "processing_time_ms": elapsed_ms,
            "privacy_guarantees": {
                "speaker_identification": "disabled",
                "speech_transcription": "disabled",
                "biometrics": "none"
            },
            "disclaimer": (
                "Simulated classroom audio demonstration. "
                "Loudness reflects acoustic energy and must never be equated to student engagement. "
                "Zero speaker identification or voice biometrics performed."
            )
        }

# Singleton instance
audio_intelligence = ClassroomAudioIntelligence()
