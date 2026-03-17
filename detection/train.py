from ultralytics import YOLO
import os

# Paths
DATA_YAML = os.path.join(os.path.dirname(__file__), "dataset", "data.yaml")
WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "weights")

# Create weights folder if it doesn't exist
os.makedirs(WEIGHTS_DIR, exist_ok=True)

# Load YOLOv8 nano model
model = YOLO("yolov8n.pt")

# Train
model.train(
    data=DATA_YAML,
    epochs=50,
    imgsz=640,
    project=WEIGHTS_DIR,
    name="train",
    exist_ok=True
)

print("Training complete! Best weights saved to detection/weights/train/weights/best.pt")