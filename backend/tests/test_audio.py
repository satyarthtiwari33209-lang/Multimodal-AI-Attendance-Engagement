import io
import math
import struct
import wave
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def create_synthetic_wav_bytes(duration_seconds: float = 2.0, sample_rate: int = 16000) -> bytes:
    """
    Generates an in-memory valid 16-bit PCM mono WAV file:
    - First half: 440Hz sine wave tone (active acoustic signal)
    - Second half: silence (zeros)
    """
    buffer = io.BytesIO()
    total_samples = int(duration_seconds * sample_rate)
    tone_samples = total_samples // 2
    silence_samples = total_samples - tone_samples

    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)        # Mono
        wf.setsampwidth(2)        # 16-bit
        wf.setframerate(sample_rate)

        # Tone section: 440Hz sine wave
        frames = bytearray()
        for i in range(tone_samples):
            val = int(18000 * math.sin(2 * math.pi * 440 * i / sample_rate))
            frames.extend(struct.pack("<h", val))

        # Silence section: zeros
        for _ in range(silence_samples):
            frames.extend(struct.pack("<h", 0))

        wf.writeframes(frames)

    return buffer.getvalue()


def test_audio_status_and_privacy_declarations():
    """Verifies audio system status, active libraries, and strict privacy guarantees."""
    response = client.get("/api/audio/status")
    assert response.status_code == 200
    data = response.json()
    assert "audio_processing_enabled" in data
    assert "active_engine" in data
    assert "installed_libraries" in data
    assert data["installed_libraries"]["soundfile"] is True
    assert data["installed_libraries"]["numpy"] is True

    # Privacy boundaries
    privacy = data["privacy_guarantees"]
    assert privacy["speaker_identification"] == "strictly_disabled"
    assert privacy["speech_transcription"] == "strictly_disabled"
    assert privacy["loudness_claim"] == "loudness_does_not_equal_engagement"


def test_toggle_audio_processing_killswitch():
    """Verifies that audio processing can be completely disabled and re-enabled."""
    # 1. Disable audio processing
    toggle_off = client.post("/api/audio/toggle-processing", json={"enabled": False})
    assert toggle_off.status_code == 200
    assert toggle_off.json()["audio_processing_enabled"] is False

    # 2. Uploading audio when disabled must be rejected with 403 Forbidden
    wav_bytes = create_synthetic_wav_bytes(1.0)
    blocked = client.post(
        "/api/audio/analyze-wav",
        files={"file": ("test.wav", wav_bytes, "audio/wav")},
        data={"demo_mode": "false"}
    )
    assert blocked.status_code == 403
    assert "disabled" in blocked.json()["detail"].lower()

    # 3. Re-enable audio processing
    toggle_on = client.post("/api/audio/toggle-processing", json={"enabled": True})
    assert toggle_on.status_code == 200
    assert toggle_on.json()["audio_processing_enabled"] is True


def test_analyze_wav_demo_mode():
    """Verifies demo simulation mode works without requiring actual audio recording and flags is_simulated."""
    dummy_wav = b"RIFF....WAVE"
    response = client.post(
        "/api/audio/analyze-wav",
        files={"file": ("lecture_audio.wav", dummy_wav, "audio/wav")},
        data={"demo_mode": "true", "frame_interval_seconds": "0.5"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_simulated"] is True
    assert data["analysis_engine"] == "demo_simulation"
    assert data["duration_seconds"] == 30.0
    assert data["speech_duration_seconds"] > 0
    assert data["silence_duration_seconds"] > 0
    assert len(data["timeline"]) > 0
    assert len(data["silence_intervals"]) > 0
    assert "acoustic_environment" in data
    assert "Loudness reflects acoustic energy" in data["disclaimer"]


def test_analyze_wav_actual_processing():
    """Verifies actual decoding, RMS energy, ZCR, and silence detection on synthetic audio."""
    wav_bytes = create_synthetic_wav_bytes(duration_seconds=2.0, sample_rate=16000)
    response = client.post(
        "/api/audio/analyze-wav",
        files={"file": ("classroom_sample.wav", wav_bytes, "audio/wav")},
        data={"demo_mode": "false", "frame_interval_seconds": "0.2"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_simulated"] is False
    assert 1.9 <= data["duration_seconds"] <= 2.1
    assert data["speech_duration_seconds"] > 0
    assert data["silence_duration_seconds"] > 0
    assert len(data["timeline"]) >= 8

    # Verify frame metric fields
    first_frame = data["timeline"][0]
    assert "time_seconds" in first_frame
    assert "timestamp_formatted" in first_frame
    assert "rms_energy" in first_frame
    assert "rms_db" in first_frame
    assert "zcr" in first_frame
    assert "speech_active" in first_frame

    # Tone section has higher energy than silence section
    assert data["average_rms_energy"] > 0.01
    assert data["peak_rms_energy"] > data["average_rms_energy"]

    # Silence interval should be detected in second half
    assert len(data["silence_intervals"]) >= 1
    assert data["silence_intervals"][0]["duration_seconds"] >= 0.4


def test_analyze_wav_invalid_extension():
    """Verifies 400 Bad Request for unsupported file extensions."""
    response = client.post(
        "/api/audio/analyze-wav",
        files={"file": ("transcript.txt", b"plain text audio notes", "text/plain")},
        data={"demo_mode": "false"}
    )
    assert response.status_code == 400
    assert "Invalid audio format" in response.json()["detail"]


def test_analyze_wav_empty_file():
    """Verifies 400 Bad Request for 0-byte uploaded files."""
    response = client.post(
        "/api/audio/analyze-wav",
        files={"file": ("empty.wav", b"", "audio/wav")},
        data={"demo_mode": "false"}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_analyze_wav_oversized():
    """Verifies 413 Content Too Large when exceeding 25MB."""
    oversized_bytes = b"0" * (25 * 1024 * 1024 + 1024)
    response = client.post(
        "/api/audio/analyze-wav",
        files={"file": ("huge_recording.wav", oversized_bytes, "audio/wav")},
        data={"demo_mode": "false"}
    )
    assert response.status_code == 413
    assert "maximum permitted size" in response.json()["detail"].lower()


def test_retained_audio_and_deletion_workflow():
    """Verifies local retention and permanent deletion endpoints."""
    wav_bytes = create_synthetic_wav_bytes(1.0)
    # 1. Upload with retain_audio = True
    response = client.post(
        "/api/audio/analyze-wav",
        files={"file": ("temp_lecture.wav", wav_bytes, "audio/wav")},
        data={"demo_mode": "false", "retain_audio": "true"}
    )
    assert response.status_code == 200
    data = response.json()
    retained_id = data.get("retained_file_id")
    assert retained_id is not None

    # 2. Delete the retained audio file
    del_res = client.delete(f"/api/audio/files/{retained_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 3. Deleting again returns 404
    del_res_again = client.delete(f"/api/audio/files/{retained_id}")
    assert del_res_again.status_code == 404

    # 4. Clear all temporary audio files
    clear_res = client.delete("/api/audio/files")
    assert clear_res.status_code == 200
    assert "files_deleted" in clear_res.json()
