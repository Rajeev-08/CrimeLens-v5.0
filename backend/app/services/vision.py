# backend/app/services/vision.py
import cv2
import numpy as np
from ultralytics import YOLO
import os

class VideoDetector:
    def __init__(self):
        print("Loading YOLOv5 model...")
        
        # Define the exact path to the weights file
        # This assumes the file is in the root 'backend' folder
        model_path = os.path.join(os.getcwd(), "yolov5su.pt")

        if os.path.exists(model_path):
            print(f"✅ Found local weights at: {model_path}")
            try:
                self.model = YOLO(model_path) 
                print("✅ YOLOv5 Model Loaded Successfully from local file.")
            except Exception as e:
                print(f"❌ Error loading local model: {e}")
                self.model = None
        else:
            print(f"❌ Model file not found at: {model_path}")
            print("Please download 'yolov5su.pt' and place it in the 'backend' folder.")
            self.model = None

    def process_frame(self, frame):
        if self.model is None:
            # Fallback if model failed to load
            cv2.putText(frame, "AI MODEL MISSING - CHECK CONSOLE", (50, 50), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            return frame, None

        # Run inference
        results = self.model(frame, verbose=False)
        
        # Plot results on the frame
        annotated_frame = results[0].plot()
        
        # Check for detections (specifically Person or Cell Phone)
        # Class 0 = Person in COCO dataset
        alert = None
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                if cls_id == 0: # Person detected
                    alert = "Person Detected"
                # You can add logic here for weapons if you have a custom trained model
                
        return annotated_frame, alert

    def generate_frames(self, source):
        # Handle webcam index (int) vs file path (str)
        video_source = source
        if str(source).isdigit():
            video_source = int(source)
            
        cap = cv2.VideoCapture(video_source)
        
        if not cap.isOpened():
            print(f"Error: Could not open video source {source}")
            return

        while True:
            success, frame = cap.read()
            if not success:
                # If reading from a file, loop it
                if isinstance(video_source, str):
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    break

            # Process frame
            processed_frame, alert = self.process_frame(frame)

            # Encode to JPEG
            ret, buffer = cv2.imencode('.jpg', processed_frame)
            frame_bytes = buffer.tobytes()

            # Yield frame
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        cap.release()