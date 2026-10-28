# Pretrained Person Detection Model Weights

This directory holds optional pretrained computer vision model weights for the Classroom Vision Module.

## Supported Architectures

### 1. MobileNet-SSD (Caffe) - Recommended for Fast CPU Inference
- **Prototxt File**: `MobileNetSSD_deploy.prototxt`
- **Model Weights File**: `MobileNetSSD_deploy.caffemodel`
- **Detection Target**: Pascal VOC Person Class (ID 15)
- **Download Instructions**:
  ```bash
  # Download prototxt
  curl -O https://raw.githubusercontent.com/chuanqi305/MobileNet-SSD/master/MobileNetSSD_deploy.prototxt
  
  # Download caffemodel
  curl -O https://raw.githubusercontent.com/chuanqi305/MobileNet-SSD/master/MobileNetSSD_deploy.caffemodel
  ```

### 2. YOLOv8 / YOLOv11 Person Detector (ONNX)
- Any standard ONNX person detection model file named `*.onnx` (e.g., `yolov8n.onnx`).
- Automatically read via OpenCV `cv2.dnn.readNetFromONNX(...)`.

---

## Zero-Download Fallback (Built-in)
If no files are placed in this directory:
1. The system automatically utilizes the built-in **OpenCV Adaptive Contour & Aspect-Ratio Person Detector** with Non-Maximum Suppression (NMS).
2. The system also supports the **Demo Simulation Mode** (`demo_mode=True`), allowing complete end-to-end evaluation with zero external weights.
