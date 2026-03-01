import cv2
import torch
import torch.nn as nn
import numpy as np
import threading
import time
import os
from ultralytics import YOLO
import supervision as sv
from torchvision import models, transforms
from collections import deque

# ================= 1. WEAPON DETECTION SETUP =================
try:
    weapon_model_path = "best.pt" if os.path.exists("best.pt") else "yolov5su.pt"
    weapon_model = YOLO(weapon_model_path)
    tracker = sv.ByteTrack()
    smoother = sv.DetectionsSmoother(length=5)
    box_annotator = sv.BoxAnnotator(thickness=2)
    label_annotator = sv.LabelAnnotator(text_thickness=2, text_scale=0.7)
    print(f"✅ Weapon Model Loaded: {weapon_model_path}")
except Exception as e:
    print(f"❌ Weapon Model Error: {e}")
    weapon_model = None

# ================= 2. VIOLENCE DETECTION SETUP =================
class MockViolenceModel(nn.Module):
    def forward(self, x):
        return torch.tensor([[0.1]])

try:
    from model import ViolenceModel
    print("✅ Found 'model.py', using real architecture.")
except ImportError:
    print("⚠️ 'model.py' not found. Using MockViolenceModel.")
    ViolenceModel = MockViolenceModel

violence_model = None
violence_device = "cuda" if torch.cuda.is_available() else "cpu"
violence_buffer = []
SEQUENCE_LENGTH = 16
VIOLENCE_THRESHOLD = 0.65

try:
    violence_model = ViolenceModel().to(violence_device)
    if os.path.exists("violence_model.pth"):
        try:
            violence_model.load_state_dict(torch.load("violence_model.pth", map_location=violence_device), strict=False)
            print("✅ Violence Model Weights Loaded")
        except RuntimeError:
            print(f"⚠️ Weights Mismatch. Switching to Mock Mode.")
            violence_model = MockViolenceModel().to(violence_device)
    else:
        print("⚠️ 'violence_model.pth' not found. Running in Mock Mode.")
    violence_model.eval()
except Exception as e:
    print(f"❌ Violence Model Critical Error: {e}")
    violence_model = MockViolenceModel().to(violence_device)

# ================= 3. SHOPLIFTING DETECTION SETUP (NEW) =================
shoplifting_model = None
shoplifting_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
shoplifting_history = deque(maxlen=10) # Smoothing window
SHOPLIFTING_THRESHOLD = 0.7
shoplifting_transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

try:
    if os.path.exists("shoplifting_model.pth"):
        shoplifting_model = models.resnet18(weights=None) # Start blank
        shoplifting_model.fc = nn.Linear(shoplifting_model.fc.in_features, 2) # Binary Class: Normal vs Shoplifting
        shoplifting_model.load_state_dict(torch.load("shoplifting_model.pth", map_location=shoplifting_device))
        shoplifting_model = shoplifting_model.to(shoplifting_device)
        shoplifting_model.eval()
        print("✅ Shoplifting Model Loaded (ResNet18)")
    else:
        print("⚠️ 'shoplifting_model.pth' not found. Shoplifting mode will be unavailable.")
except Exception as e:
    print(f"❌ Shoplifting Model Error: {e}")
    shoplifting_model = None

# ================= 4. PROCESSING FUNCTIONS =================

def process_weapon_frame(frame):
    if not weapon_model: return frame
    
    results = weapon_model(frame, imgsz=640, conf=0.4, verbose=False)[0]
    detections = sv.Detections.from_ultralytics(results)
    
    # Filter for weapon classes
    target_keywords = ["pistol", "knife", "gun", "weapon", "firearm", "rifle"]
    selected_class_ids = [id for id, name in weapon_model.names.items() if any(k in name.lower() for k in target_keywords)]
    
    if selected_class_ids:
        detections = detections[np.isin(detections.class_id, selected_class_ids)]

    detections = tracker.update_with_detections(detections)
    detections = smoother.update_with_detections(detections)
    
    # NEW CODE
# This forces the label to be "WEAPON" regardless of what was detected (pistol, knife, etc.)
    labels = [f"WEAPON {conf:.2f}" for conf in detections.confidence]
    
    annotated_frame = box_annotator.annotate(scene=frame.copy(), detections=detections)
    return label_annotator.annotate(scene=annotated_frame, detections=detections, labels=labels)

def process_violence_frame(frame):
    global violence_buffer
    if not violence_model: return frame

    try:
        resized = cv2.resize(frame, (224, 224))
        normalized = resized.astype(np.float32) / 255.0
        violence_buffer.append(normalized)

        if len(violence_buffer) > SEQUENCE_LENGTH:
            violence_buffer.pop(0)

        prob = 0.0
        label = "NORMAL"
        color = (0, 255, 0)

        if len(violence_buffer) == SEQUENCE_LENGTH:
            clip = np.array(violence_buffer)
            clip = torch.from_numpy(clip).permute(3, 0, 1, 2).unsqueeze(0).to(violence_device)

            with torch.no_grad():
                output = violence_model(clip)
                prob = torch.sigmoid(output).item()

        if prob > VIOLENCE_THRESHOLD:
            label = "VIOLENCE"
            color = (0, 0, 255)

        cv2.rectangle(frame, (0, 0), (300, 60), (0,0,0), -1)
        cv2.putText(frame, f"{label}: {prob:.2f}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
        
    except Exception as e:
        print(f"Violence Process Error: {e}")
        
    return frame

def process_shoplifting_frame(frame):
    global shoplifting_history
    if not shoplifting_model:
        return frame

    try:
        # 1. Inference
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img_tensor = shoplifting_transform(rgb).unsqueeze(0).to(shoplifting_device)

        with torch.no_grad():
            outputs = shoplifting_model(img_tensor)
            probs = torch.softmax(outputs, dim=1)
            shoplifting_prob = probs[0][1].item()
            
        shoplifting_history.append(shoplifting_prob)
        avg_prob = np.mean(shoplifting_history)

        # 2. Settings
        h, w = frame.shape[:2]
        is_alert = avg_prob >= SHOPLIFTING_THRESHOLD
        color = (0, 0, 255) if is_alert else (0, 255, 0)
        
        # 3. Minimal Top Alert (Small Pill)
        if is_alert:
            # Draw tiny red rounded rectangle background
            cv2.rectangle(frame, (20, 20), (120, 55), (0, 0, 255), -1)
            cv2.putText(frame, "ALERT", (35, 45), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            # Subtle frame glow
            cv2.rectangle(frame, (0, 0), (w, h), (0, 0, 255), 4)

        # 4. Tiny Bottom Info (No Background)
        label = "SHOPLIFTING" if is_alert else "NORMAL"
        # Status text
        cv2.putText(frame, f"Activity: {label}", (20, h - 35), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)
        # Confidence text
        cv2.putText(frame, f"Conf: {avg_prob*100:.1f}%", (20, h - 15), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 200, 200), 1)

    except Exception as e:
        print(f"Shoplifting UI Error: {e}")

    return frame

# ================= 5. VIDEO STREAMER CLASS =================

class VideoStreamer:
    def __init__(self):
        self.camera = None
        self.is_running = False
        self.mode = "weapon"
        self.current_source = None
        self.fps = 30 
        self.lock = threading.Lock() # ✅ Added lock for thread safety

    def start_stream(self, source=0, mode="weapon"):
        with self.lock: # ✅ Use lock to prevent simultaneous access during switch
            if source == "webcam": source = 0
            if isinstance(source, str) and source.isdigit(): source = int(source)

            # Normalize File Paths
            if isinstance(source, str):
                if not os.path.isabs(source):
                    source = os.path.abspath(source)
                if not os.path.exists(source):
                    print(f"❌ Error: File not found at {source}")
                    return

            # If it's already running the SAME source, just change the mode
            if self.is_running and self.camera:
                if self.current_source == source:
                    self.mode = mode
                    return
                else:
                    print(f"🔄 Switching source safely: {self.current_source} -> {source}")
                    self.stop_stream_locked() # ✅ Private stop to stay inside lock

            self.mode = mode
            self.current_source = source
            
            # Use appropriate API for Windows vs Linux
            if os.name == 'nt' and (source == 0 or isinstance(source, int)):
                self.camera = cv2.VideoCapture(source, cv2.CAP_DSHOW)
            else:
                self.camera = cv2.VideoCapture(source)

            if not self.camera.isOpened():
                print(f"❌ Critical Error: Could not open source {source}")
                self.is_running = False
            else:
                self.is_running = True
                self.fps = self.camera.get(cv2.CAP_PROP_FPS)
                if self.fps <= 0 or self.fps > 120: self.fps = 30
                print(f"✅ Stream Started: {source} @ {self.fps:.2f} FPS")

    def stop_stream_locked(self):
        """Internal stop method to be used inside a lock."""
        self.is_running = False
        if self.camera:
            self.camera.release()
            self.camera = None
        time.sleep(0.2) # ✅ Brief pause to let FFmpeg locks release

    def stop_stream(self):
        with self.lock:
            self.stop_stream_locked()
    def stop_stream(self):
        """Public method to safely stop and release the camera/file."""
        with self.lock:
            print("🛑 Manually stopping stream and releasing resources...")
            self.stop_stream_locked()

    def generate_frames(self):
        while True:
            # We check is_running outside the lock to keep streaming smooth
            if not self.is_running or not self.camera:
                break
                
            start_time = time.time()
            
            # Using a nested try/except to catch decoder failures
            try:
                success, frame = self.camera.read()
                if not success:
                    # Loop logic
                    self.camera.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    success, frame = self.camera.read()
                    if not success: break

                # Process based on mode
                if self.mode == "weapon":
                    processed_frame = process_weapon_frame(frame)
                elif self.mode == "violence":
                    processed_frame = process_violence_frame(frame)
                elif self.mode == "shoplifting":
                    processed_frame = process_shoplifting_frame(frame)
                else:
                    processed_frame = frame

                ret, buffer = cv2.imencode('.jpg', processed_frame)
                if not ret: continue
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                
                # Dynamic FPS control
                frame_delay = 1.0 / self.fps
                process_time = time.time() - start_time
                wait_time = frame_delay - process_time
                if wait_time > 0:
                    time.sleep(wait_time)
                    
            except Exception as e:
                print(f"⚠️ Stream Processing Exception: {e}")
                break
video_service = VideoStreamer()