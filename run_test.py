import os
import cv2
import re
from ultralytics import YOLO
from ocr.extractor import get_raw_text

IMAGE_PATH = "temp_test_input.jpg" 
WEIGHTS_PATH = os.path.join("detection", "weights", "best.pt")

def test_regex_ocr():
    if not os.path.exists(IMAGE_PATH):
        print(f"❌ Error: Cannot find image '{IMAGE_PATH}'")
        return

    print(f"🚀 Running YOLO on {IMAGE_PATH}...")
    model = YOLO(WEIGHTS_PATH)
    results = model(IMAGE_PATH)
    
    stickers = []
    
    for result in results:
        for box in result.boxes:
            if float(box.conf) < 0.48:
                continue
            class_name = result.names[int(box.cls)]
            coords = list(map(int, box.xyxy[0].tolist()))
            if class_name == "sticker":
                stickers.append(coords)

    stickers.sort(key=lambda s: s[0])
    
    img = cv2.imread(IMAGE_PATH)
    h, w = img.shape[:2]
    
    print("\n" + "="*50)
    print("🎯 REGEX OCR TEST RESULTS")
    print("="*50)

    # Regex pattern: Look for digits, followed by 'Q', followed by digits
    id_pattern = re.compile(r'\b\d+Q\d+\b')

    for i, box in enumerate(stickers):
        x1, y1, x2, y2 = box
        
        # Padding
        px1, py1 = max(0, x1 - 15), max(0, y1 - 15)
        px2, py2 = min(w, x2 + 15), min(h, y2 + 15)
        
        crop_img = img[py1:py2, px1:px2]
        crop_path = f"test_crops/test_sticker_{i+1}.jpg"
        cv2.imwrite(crop_path, crop_img)
        
        # 1. We import PaddleOCR directly here just for the test to get the full raw text
        from paddleocr import PaddleOCR
        ocr_model = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False, show_log=False)
        result = ocr_model.ocr(crop_path, cls=True)
        
        if not result or result[0] is None:
            print(f"Slot {i+1:02d} | No text found")
            continue
            
        extracted_words = []
        for line in result[0]:
            try:
                extracted_words.append(line[1][0])
            except:
                continue
                
        # The jumbled string from PaddleOCR
        full_text = " ".join(extracted_words)
        
        # 2. Search for the Alstom ID pattern!
        match = id_pattern.search(full_text)
        
        if match:
            final_id = match.group(0)
            status = "✅ REGEX MATCH"
        else:
            final_id = full_text.split()[0] if full_text else "None"
            status = "❌ FALLBACK"
            
        print(f"Slot {i+1:02d} | Raw OCR saw: '{full_text}' | Final Extracted ID: '{final_id}' {status}")

if __name__ == "__main__":
    import logging
    logging.getLogger("ppocr").setLevel(logging.ERROR)
    test_regex_ocr()