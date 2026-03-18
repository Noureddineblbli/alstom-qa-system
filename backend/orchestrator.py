import sys
import os
import cv2
import numpy as np

# We ensure Python can find your 'preprocessing' and 'ocr' folders
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def process_factory_image(image_bytes):
    """
    Master Orchestrator Pipeline:
    Receives raw uploaded image bytes from the API, and prepares them.
    """
    print("\n[ORCHESTRATOR] 1. Receiving image bytes from frontend...")
    
    # Decode the byte stream back into a physical OpenCV Matrix (Image)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    if img is None:
        print("[ORCHESTRATOR] ❌ Error: Failed to decode image.")
        return {"status": "ERROR", "message": "Failed to process image."}

    print(f"[ORCHESTRATOR] ✅ Image successfully decoded! Dimensions: {img.shape}")
    
    # We will build out the daisy-chain (YOLO -> MAPPING -> OCR) in the next step!
    return {
        "status": "OK",
        "dimensions": str(img.shape),
        "message": "Orchestrator successfully received and prepared the image."
    }


# --- TEST BLOCK ---
if __name__ == "__main__":
    # Let's test this locally by pretending an uploaded image is one of our crops
    test_img_path = "preprocessing/crops/pair_0_switch.jpg"
    
    if os.path.exists(test_img_path):
        # Open file as pure binary (how a web server receives it)
        with open(test_img_path, "rb") as f:
            raw_bytes = f.read()
            
        # Send binary payload to our new master pipeline
        process_factory_image(raw_bytes)
    else:
        print(f"Error: Could not find {test_img_path}. Did you delete the test crops?")