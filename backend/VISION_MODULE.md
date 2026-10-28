# Classroom Vision Module Documentation
**Multimodal Attendance & Engagement Agent**

## 1. Executive Summary & Design Principles

The Classroom Vision Module provides automated person detection, classroom headcount estimation, and timestamped video timeline analysis using **Python** and **OpenCV**. It integrates into the FastAPI backend and connects directly to the React + Vite dashboard.

### Core Ethical & Privacy Guarantees
1. **Zero Biometrics / Facial Recognition**: The vision module strictly detects human presence and headcounts. It does **not** perform facial recognition, facial embedding generation, or biometric identification.
2. **No Cross-Frame Identity Persistence**: A detected person in frame $t$ is never assumed to be the same individual in frame $t+1$. Person detections represent instantaneous spatial presence, not individual student tracking.
3. **Transient In-Memory Media by Default**: Uploaded images and video files are processed in local volatile memory. Uploaded files are discarded immediately after inference unless the client explicitly requests local retention.
4. **Local Data Sovereignty & Deletion Endpoints**: Media never leaves the local host machine. Any retained media files can be permanently purged via dedicated deletion endpoints.
5. **Human-in-the-Loop Authority**: Computer vision detections do not automatically commit official attendance records. Instead, an authorized teacher reviews the detected headcount against the enrolled student roster and manually confirms attendance.

---

## 2. Architecture & Detection Engines

The vision module (`backend/services/vision_detector.py`) implements a multi-tier fallback architecture:

```
[Uploaded Image / Video]
            │
            ▼
┌───────────────────────────────┐
│     Demo Mode Requested?      │───► YES ───► Synthetic Ground-Truth Headcount
└───────────────────────────────┘              (is_simulated: True, zero weights needed)
            │ NO
            ▼
┌───────────────────────────────┐
│ Pretrained DNN Weights Found? │───► YES ───► OpenCV cv2.dnn
│  - MobileNet-SSD Caffe        │              (readNetFromCaffe / readNetFromONNX)
│  - YOLOv8/v11 ONNX            │
└───────────────────────────────┘
            │ NO
            ▼
┌───────────────────────────────┐
│ Built-in OpenCV Contour &     │
│ Aspect-Ratio Silhouette       │───► Adaptive Gaussian Thresholding + Morphological
│ Headcount Engine with NMS     │     Kernels + Aspect-Ratio Filtering (1.15 to 3.8)
└───────────────────────────────┘
```

### Pretrained Model Weights Installation
The detector inspects `backend/models/weights/` at startup.

#### Option A: MobileNet-SSD (Caffe)
- **Protobuf**: `backend/models/weights/MobileNetSSD_deploy.prototxt`
- **Caffe Model**: `backend/models/weights/MobileNetSSD_deploy.caffemodel`
- **Class**: Pascal VOC class 15 (`person`)
- **Download**:
  ```bash
  curl -o backend/models/weights/MobileNetSSD_deploy.prototxt https://raw.githubusercontent.com/chuanqi305/MobileNet-SSD/master/MobileNetSSD_deploy.prototxt
  curl -o backend/models/weights/MobileNetSSD_deploy.caffemodel https://raw.githubusercontent.com/chuanqi305/MobileNet-SSD/master/MobileNetSSD_deploy.caffemodel
  ```

#### Option B: YOLOv8 / YOLOv11 ONNX
- Any standard ONNX export named `*.onnx` (e.g. `yolov8n.onnx`) placed inside `backend/models/weights/`.

#### Option C: Built-in Adaptive Computer Vision (Zero-Download Default)
- Utilizes OpenCV Gaussian filtering, adaptive thresholding, human aspect ratio heuristics ($1.15 \le h/w \le 3.8$), and Non-Maximum Suppression (NMS). Operates out of the box with zero external files.

---

## 3. Media Validation & Limitations

### Validation Constraints
| Parameter | Classroom Image | Video File |
|---|---|---|
| **Max File Size** | 10 MB | 50 MB |
| **Supported Formats** | `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp` | `.mp4`, `.avi`, `.mov`, `.mkv`, `.webm` |
| **Sampling Interval** | N/A (single frame) | Configurable ($0.2\text{s}$ to $10.0\text{s}$, default $1.0\text{s}$) |
| **Max Sampled Frames** | 1 | 100 frames per request (safety ceiling) |

### Error Codes
- `400 Bad Request`: Unsupported file extension.
- `413 Content Too Large`: Exceeds 10 MB (image) or 50 MB (video).
- `422 Unprocessable Entity`: Corrupt video container or unreadable image bytes.
- `404 Not Found`: Target class session or retained file ID not found.

---

## 4. API Endpoints

### 1. `GET /api/vision/model-status`
Returns detector capabilities, active model, and privacy assertions.

**Response:**
```json
{
  "active_detector": "opencv_contour_detector",
  "has_custom_weights": false,
  "weights_directory": "E:\\tiwaris project\\backend\\models\\weights",
  "files_in_weights_dir": [],
  "opencv_version": "5.0.0",
  "biometrics_enabled": false,
  "facial_recognition": "strictly_disabled_by_design",
  "supported_models": [
    "MobileNetSSD_deploy.prototxt + MobileNetSSD_deploy.caffemodel (Pascal VOC person class 15)",
    "YOLOv8n ONNX / Custom Person Detection ONNX model",
    "OpenCV Adaptive Contour & Aspect-Ratio Person Detector (Built-in)"
  ],
  "demo_mode_available": true
}
```

### 2. `POST /api/vision/detect-image`
Processes an uploaded classroom image.

**Form Data:**
- `file`: Image binary (multipart/form-data)
- `demo_mode`: `true` | `false`
- `retain_media`: `true` | `false`

**Response:**
```json
{
  "person_count": 7,
  "bounding_boxes": [
    { "box": [80, 120, 110, 210], "confidence": 0.94, "label": "person" }
  ],
  "image_width": 640,
  "image_height": 480,
  "detection_source": "opencv_contour_detector",
  "is_simulated": false,
  "confidence_average": 0.88,
  "processing_time_ms": 42.15,
  "retained_file_id": null,
  "disclaimer": "Detections represent instantaneous headcount. No facial recognition or persistent student tracking is performed."
}
```

### 3. `POST /api/vision/detect-video`
Samples frames at periodic intervals and returns headcount timeline.

**Form Data:**
- `file`: Video binary
- `sample_rate_seconds`: `1.0` (default)
- `demo_mode`: `true` | `false`
- `retain_media`: `true` | `false`

**Response:**
```json
{
  "video_metadata": {
    "duration_seconds": 15.0,
    "fps": 30.0,
    "resolution": "1280x720",
    "total_frames_in_video": 450
  },
  "total_frames_sampled": 15,
  "sampling_interval_seconds": 1.0,
  "average_person_count": 7.2,
  "peak_person_count": 8,
  "min_person_count": 6,
  "frame_timeline": [
    {
      "frame_index": 0,
      "timestamp_ms": 0.0,
      "timestamp_formatted": "00:00.000",
      "person_count": 7,
      "bounding_boxes": [...]
    }
  ],
  "detection_source": "demo_simulation",
  "is_simulated": true,
  "processing_time_ms": 18.5,
  "disclaimer": "Person counts represent frame-level headcounts. In accordance with privacy standards, detections are not assumed to represent unique identities across frames."
}
```

### 4. `POST /api/vision/confirm-attendance`
Authorizes teacher review and manual confirmation.

**Request:**
```json
{
  "session_id": 1,
  "detection_source_type": "image",
  "detected_headcount": 7,
  "authorized_teacher_name": "Dr. Sarah Mitchell",
  "confirmations": [
    { "student_id": 1, "status": "present", "notes": "Front row seat" },
    { "student_id": 2, "status": "late", "notes": "Arrived 10 mins late" },
    { "student_id": 3, "status": "absent", "notes": "Excused illness" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "session_id": 1,
  "confirmed_count": 2,
  "message": "Attendance successfully confirmed by Dr. Sarah Mitchell for session CS101-FALL.",
  "timestamp": "2026-10-28T14:35:00.000000+00:00"
}
```

### 5. `DELETE /api/vision/files/{file_id}` & `DELETE /api/vision/files`
Permanently deletes retained temporary uploads.

---

## 5. Technical Limitations & Operational Boundaries

1. **Occlusion in Tiered Classrooms**: Extreme student occlusion (e.g. students seated behind tall monitors or in densely packed rows) may result in lower headcount detection in a single frame. In such scenarios, video timeline sampling or multi-angle captures should be utilized.
2. **Low-Contrast Lighting**: Silhouette contour detection relies on contrast between human upper torsos and desks/backgrounds. Under dark projection environments, MobileNet-SSD or YOLO ONNX models provide superior accuracy over contour detection.
3. **No Student Identity Linking**: Because facial recognition is deliberately absent, the system cannot deduce which physical seat maps to which student roster record. The teacher review panel provides the necessary human-in-the-loop bridge.
4. **Transient Video Disk Usage**: During video processing, the uploaded stream is written to a temporary local file so OpenCV `VideoCapture` can seek frames efficiently. The file is unlinked immediately in the `finally` block unless `retain_media=True`.
