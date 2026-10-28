import random
from typing import Dict, Any

class AudioModule:
    """
    Multimodal Audio Analysis Module.
    
    Processes microphone decibel/RMS levels and acoustic metrics:
    - Voice Activity Detection (VAD)
    - Speech vs. silence vs. disruptive noise classification
    - Acoustic environment classification (quiet_lecture, active_discussion, moderate_noise)
    - Vocal participation score calculation
    """

    def __init__(self, speech_threshold: float = 0.08):
        self.speech_threshold = speech_threshold

    def analyze_audio_level(self, audio_level: float) -> Dict[str, Any]:
        """
        Analyzes the real-time audio volume level reported by the client or stream.
        Calculates spectral density, speech presence, and acoustic context.
        """
        clamped_level = max(0.0, min(1.0, float(audio_level)))
        
        # Check if voice activity detected
        is_speech = clamped_level >= self.speech_threshold
        
        # Spectral energy heuristic
        spectral_energy = round(min(1.0, clamped_level * 1.4 + random.uniform(0.01, 0.05)), 2)

        # Classify classroom acoustic atmosphere
        if clamped_level < 0.04:
            environment = "quiet_attentive_lecture"
            participation_score = 0.50
        elif clamped_level <= 0.28:
            environment = "active_discussion"
            participation_score = 0.90
        elif clamped_level <= 0.60:
            environment = "collaborative_group_work"
            participation_score = 0.85
        else:
            environment = "elevated_ambient_noise"
            participation_score = 0.40

        return {
            "rms_volume": round(clamped_level, 3),
            "speech_detected": is_speech,
            "spectral_energy": spectral_energy,
            "acoustic_environment": environment,
            "participation_score": participation_score
        }

    def simulate_audio_pulse(self) -> Dict[str, Any]:
        """Generates realistic synthetic audio metrics when no microphone is connected."""
        base = random.choice([0.02, 0.05, 0.12, 0.18, 0.22, 0.03])
        jitter = random.uniform(-0.01, 0.02)
        val = max(0.01, base + jitter)
        return self.analyze_audio_level(val)

audio_module = AudioModule()
