import re
import cv2
import numpy as np
from ai_service.config import ocr, digit_model

def extract_only_id(raw_text):
    # Regex explicitly locks onto the format NN Q NN
    match = re.search(r'(\d{2})[QqOo0](\d{2})', raw_text)
    if match:
        return match.group(1) + 'Q' + match.group(2)

    # Catch the SPARE label
    tokens = raw_text.strip().upper()
    if 'S' in tokens and ('R' in tokens or 'P' in tokens):
        return "SPARE"
        
    return "UNKNOWN"

def read_sticker_raw(img, box):
    pad = 4
    x1 = max(0, int(box["x1"]) - pad)
    y1 = max(0, int(box["y1"]) - pad)
    x2 = min(img.shape[1], int(box["x2"]) + pad)
    y2 = min(img.shape[0], int(box["y2"]) + pad)
    
    crop_img = img[y1:y2, x1:x2]

    # Your exact Preprocessing
    scaled = cv2.resize(crop_img, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(scaled, cv2.COLOR_BGR2GRAY)
    
    kernel = np.array([[0, -1, 0], [-1, 5, -1],[0, -1, 0]])
    sharpened = cv2.filter2D(gray, -1, kernel)
    
    padded = cv2.copyMakeBorder(sharpened, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)
    result_img = cv2.cvtColor(padded, cv2.COLOR_GRAY2BGR)
    
    res = None
    try: 
        res = ocr.ocr(result_img, cls=True)
    except Exception as e:
        print(f"Error occurred while reading sticker OCR: {e}")
    raw_text = " ".join([line[1][0] for line in res[0]]) if res and res[0] else "None"
    return raw_text

def read_switch_digit(img, box):
    # 1. Extract the initial switch with a slight padding
    SWITCH_PADDING = 5
    CROP_PADDING = 10
    
    h, w = img.shape[:2]
    x1, y1 = max(0, int(box["x1"]) - SWITCH_PADDING), max(0, int(box["y1"]) - SWITCH_PADDING)
    x2, y2 = min(w, int(box["x2"]) + SWITCH_PADDING), min(h, int(box["y2"]) + SWITCH_PADDING)
    
    switch_crop = img[y1:y2, x1:x2]
    if switch_crop.size == 0:
        return "size 0"

    # 2. Run your YOLO model just to find where the digits sit (using your 0.25 thresh)
    results = digit_model(switch_crop, verbose=False)

    digits = []
    for r in results:
        for det in r.boxes:
            if float(det.conf[0]) >= 0.4:
                if float(det.xyxy[0][3] - det.xyxy[0][1]) < 10:
                    continue
                cls_id = int(det.cls[0])
                label  = digit_model.names[cls_id]
                x_pos  = int(det.xyxy[0][0])
                digits.append((x_pos, label))
    if not digits:
        return "no digits"
    return "".join(d[1] for d in sorted(digits, key=lambda d: d[0]))
    # digit_boxes = results[0].boxes

    # if digit_boxes is None or len(digit_boxes) == 0:
    #     return "no detections"

    # # 3. Consolidate bounding boxes to wrap ALL detected digits tightly
    # detections =[]
    # for det in digit_boxes:
    #     dx1, dy1, dx2, dy2 = det.xyxy[0].cpu().numpy().astype(int)
    #     detections.append((dx1, dy1, dx2, dy2))
        
    # all_x1 = min(d[0] for d in detections)
    # all_y1 = min(d[1] for d in detections)
    # all_x2 = max(d[2] for d in detections)
    # all_y2 = max(d[3] for d in detections)

    # # 4. Crop tightly around the merged bounding box with CROP_PADDING
    # sh, sw = switch_crop.shape[:2]
    # px1, py1 = max(0, all_x1 - CROP_PADDING), max(0, all_y1 - CROP_PADDING)
    # px2, py2 = min(sw, all_x2 + CROP_PADDING), min(sh, all_y2 + CROP_PADDING)
    
    # merged_crop = switch_crop[py1:py2, px1:px2]

    # # 5. Preprocessing Genius: Invert Colors and Upscale x4
    # scaled = cv2.resize(merged_crop, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    # inverted = cv2.bitwise_not(scaled)
    
    # # Save the processed switches so you can see them! (optional)
    # cv2.imwrite(f"debug_crops/switch_{x1}.png", inverted)

    # # 6. Read using PaddleOCR
    # ocr_result = None
    # try:
    #     ocr_result = ocr.ocr(inverted, cls=True)
    # except Exception as e:
    #     print(f"Error occurred while reading switch OCR: {e}")

    # if not ocr_result or not ocr_result[0]:
    #     return "ocr fail"

    # # Combine extracted texts
    # raw_text = " ".join([line[1][0] for line in ocr_result[0]])
    
    # # Paddle might rarely see '1' as 'I' or 'l' or '0' as 'O' before we force it to digits
    # clean_text = raw_text.replace("I", "1").replace("l", "1").replace("O", "0")
    
    # # Force it to strictly return the number by deleting anything that isn't a digit
    # clean_number = re.sub(r'\D', '', clean_text)
    
    # return clean_number if clean_number else "no digits"
