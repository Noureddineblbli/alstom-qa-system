from ultralytics import YOLO
import sys
import os

# Path to best weights
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "weights", "best.pt")

def predict(image_path):
    model = YOLO(WEIGHTS_PATH)
    results = model(image_path)

    for result in results:
        for box in result.boxes:
            class_id = int(box.cls)
            class_name = result.names[class_id]
            confidence = float(box.conf)
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            print(f"Class: {class_name} | Confidence: {confidence:.2f} | Box: ({x1:.1f}, {y1:.1f}, {x2:.1f}, {y2:.1f})")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
    else:
        predict(sys.argv[1])