from backend.validator import check_assembly
from ocr.post_processor import format_calibre, format_identification
from ocr.extractor import get_raw_text, get_calibre_text
from preprocessing.filters import clean_for_ocr, clean_switch_for_calibre
from preprocessing.cropper import extract_crops
from preprocessing.pairing import match_stickers_to_switches
from preprocessing.geometry import sort_left_to_right
from ultralytics import YOLO
import sys
import os

# Add root to path first before anything else
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


WEIGHTS_PATH = os.path.join(os.path.dirname(
    __file__), '..', 'detection', 'weights', 'best.pt')
CROPS_DIR = os.path.join(os.path.dirname(
    __file__), '..', 'preprocessing', 'crops')
ROW_THRESHOLD = 300


def group_by_row(detections):
    rows = []
    for det in sorted(detections, key=lambda d: (d['box'][1] + d['box'][3]) / 2):
        cy = (det['box'][1] + det['box'][3]) / 2
        placed = False
        for row in rows:
            row_cy = (row[0]['box'][1] + row[0]['box'][3]) / 2
            if abs(cy - row_cy) <= ROW_THRESHOLD:
                row.append(det)
                placed = True
                break
        if not placed:
            rows.append([det])
    return rows


def run_pipeline(image_path):
    os.makedirs(CROPS_DIR, exist_ok=True)
    results = []

    # Step 1: Detect
    model = YOLO(WEIGHTS_PATH)
    yolo_results = model(image_path)

    switches = []
    stickers = []

    for result in yolo_results:
        for i, box in enumerate(result.boxes):
            # 1. Filter out low confidence hallucinations (below 48%)
            confidence = float(box.conf)
            if confidence < 0.48:
                continue

            class_id = int(box.cls)
            class_name = result.names[class_id]
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            detection = {"id": f"{class_name}_{i}",
                         "label": class_name, "box": [x1, y1, x2, y2]}
                         
            if class_name == "switch":
                switches.append(detection)
            else:
                stickers.append(detection)

    # Step 2: Group by row
    switch_rows = group_by_row(switches)
    sticker_rows = group_by_row(stickers)

    # Step 3: Process each row
    slot_counter = 0
    for row_idx, switch_row in enumerate(switch_rows):
        row_id = f"R{row_idx + 1}"

        # Sort left to right
        switch_row = sort_left_to_right(switch_row)

        # Get matching sticker row
        sticker_row = sticker_rows[row_idx] if row_idx < len(
            sticker_rows) else []
        sticker_row = sort_left_to_right(sticker_row)

        # Pair switches with stickers
        pairs = match_stickers_to_switches(sticker_row, switch_row)

        # Step 4: Crop, filter, OCR, validate
        for slot_idx, pair in enumerate(pairs):
            slot_id = f"{row_id}-S{slot_idx + 1}"
            slot_counter += 1

            switch_crop_path = os.path.join(
                CROPS_DIR, f"pair_{slot_counter}_switch.jpg")
            sticker_crop_path = os.path.join(
                CROPS_DIR, f"pair_{slot_counter}_sticker.jpg")
            extract_crops(image_path, [pair], slot_counter)

            _, _, cleaned_sticker_path = clean_for_ocr(sticker_crop_path)

            raw_id, _ = get_raw_text(cleaned_sticker_path)
            cleaned_switch_path = clean_switch_for_calibre(switch_crop_path)
            raw_calibre, _ = get_calibre_text(cleaned_switch_path)

            clean_id = format_identification(raw_id) if raw_id else ""
            clean_calibre = format_calibre(raw_calibre) if raw_calibre else ""

            validation = check_assembly(slot_id, clean_calibre, clean_id)

            results.append({
                "slot_id": slot_id,
                "status": validation["status"],
                "scanned_calibre": clean_calibre,
                "scanned_identification": clean_id,
                "expected_calibre": validation["expected"]["calibre"],
                "expected_identification": validation["expected"]["identification"],
                "message": validation["message"]
            })
    return results


if __name__ == "__main__":
    test_image = sys.argv[1] if len(
        sys.argv) > 1 else "detection/dataset/images/1b853c8f-1773397021222.jpg"

    results = run_pipeline(test_image)

    print("\n===== PIPELINE RESULTS =====")
    for r in results:
        print(f"[{r['slot_id']}] {r['status']} | Calibre: {r['scanned_calibre']} | ID: {r['scanned_identification']} | {r['message']}")
