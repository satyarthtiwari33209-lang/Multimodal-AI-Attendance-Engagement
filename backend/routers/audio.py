import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status

from services.audio_intelligence import audio_intelligence, TEMP_AUDIO_DIR, SOUNDFILE_AVAILABLE
from schemas.audio import (
    AudioAnalysisResponse,
    AudioStatusResponse,
    AudioToggleRequest,
    AudioToggleResponse
)

router = APIRouter(prefix="/api/audio", tags=["Audio Intelligence Module"])

# Size & extension limitations
MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".ogg", ".flac"} if SOUNDFILE_AVAILABLE else {".wav"}

@router.get("/status", response_model=AudioStatusResponse)
def get_audio_system_status():
    """Returns the current audio processing status, available audio libraries, and privacy guarantees."""
    return audio_intelligence.get_status()

@router.post("/toggle-processing", response_model=AudioToggleResponse)
def toggle_audio_processing(payload: AudioToggleRequest):
    """
    Administrative kill-switch to enable or completely disable audio processing across the platform.
    When disabled, no audio uploads or live microphone streams will be analyzed.
    """
    is_enabled = audio_intelligence.set_enabled(payload.enabled)
    msg = "Audio processing enabled successfully." if is_enabled else "Audio processing disabled system-wide."
    return AudioToggleResponse(
        success=True,
        audio_processing_enabled=is_enabled,
        message=msg
    )

@router.post("/analyze-wav", response_model=AudioAnalysisResponse)
async def analyze_wav_audio(
    file: UploadFile = File(...),
    demo_mode: bool = Form(False),
    frame_interval_seconds: float = Form(0.20),
    retain_audio: bool = Form(False)
):
    """
    Analyzes an uploaded local WAV audio file.
    - Decodes duration, frame-level RMS energy, and Zero-Crossing Rate.
    - Extracts silence intervals and speech activity estimates via dual-feature VAD.
    - Calculates session participation indicators.
    - Zero speaker identification, biometric voiceprints, or conversational transcription.
    - Files are processed in volatile memory and discarded by default.
    """
    # 1. Check if audio processing is administratively disabled
    if not audio_intelligence.is_enabled() and not demo_mode:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Audio processing has been explicitly disabled by administrative policy."
        )

    # 2. Validate file extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid audio format '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
        )

    # 3. Read and validate file size
    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file exceeds maximum permitted size of {MAX_AUDIO_SIZE_BYTES // (1024*1024)} MB."
        )

    if len(audio_bytes) == 0 and not demo_mode:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty (0 bytes)."
        )

    # 4. Optional retention
    retained_file_id = None
    if retain_audio:
        retained_file_id = str(uuid.uuid4())
        save_path = TEMP_AUDIO_DIR / f"{retained_file_id}{ext}"
        try:
            with open(save_path, "wb") as f:
                f.write(audio_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retain audio file locally: {str(e)}"
            )

    # 5. Execute audio analysis
    try:
        # Clamp frame duration between 0.05s and 2.0s
        clamped_frame_interval = max(0.05, min(2.0, float(frame_interval_seconds)))
        result = audio_intelligence.analyze_audio(
            audio_bytes=audio_bytes,
            demo_mode=demo_mode,
            frame_duration_seconds=clamped_frame_interval
        )

        if retained_file_id:
            result["retained_file_id"] = retained_file_id

        return result
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio intelligence processing error: {str(e)}"
        )

@router.delete("/files/{file_id}")
def delete_retained_audio_file(file_id: str):
    """Deletes a locally retained audio file from the temporary audio storage."""
    matches = list(TEMP_AUDIO_DIR.glob(f"*{file_id}*"))
    if not matches:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retained audio file not found.")

    for f in matches:
        try:
            os.remove(f)
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    return {"success": True, "message": f"Retained audio file {file_id} deleted successfully."}

@router.delete("/files")
def clear_all_retained_audio_files():
    """Cleans up all files in the temporary audio storage directory."""
    deleted_count = 0
    for f in TEMP_AUDIO_DIR.iterdir():
        if f.is_file():
            try:
                os.remove(f)
                deleted_count += 1
            except Exception:
                pass
    return {"success": True, "files_deleted": deleted_count}
