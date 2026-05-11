import cv2
import re
from collections import Counter
from ultralytics import YOLO
from paddleocr import PaddleOCR
import json
import os

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
DETECTION_MODEL = "detection\SwSt_RT-DETR.pt"
DIGIT_MODEL = "detection\Digit_Recognition_rt-edtr.pt"
STICKER_CLASS_NAME = "sticker"
SWITCH_CLASS_NAME = "switch"
REFERENCE_JSON = "data/blueprint.json"

# INIT
ocr = PaddleOCR(use_angle_cls=False, lang="en", show_log=False)
detect_model = YOLO(DETECTION_MODEL)
digit_model = YOLO(DIGIT_MODEL)

# ─────────────────────────────────────────────
# CORE: JSON & VALIDATION
# ─────────────────────────────────────────────


def build_validation_lookup(reference_json_path):
    with open(reference_json_path, "r") as f:
        reference = json.load(f)
    return {item["slot_id"]: item for item in reference}


def validate_record(slot_id, identification, calibre, ref_lookup):
    ref = ref_lookup.get(slot_id)
    if not ref:
        return False, [f"⚠️  No reference found for '{slot_id}'"]

    exp_id = ref["expected_identification"].strip().upper()
    exp_cal = ref["expected_calibre"].strip().upper()
    got_id = identification.strip().upper()
    got_cal = calibre.strip().upper()

    issues = []
    where = []
    if exp_id != got_id:
        issues.append(f"ID: expected '{exp_id}' got '{got_id}'")
        where.append("sticker")

    if exp_cal == "MISSING":
        if got_cal != "MISSING":
            issues.append(f"Calibre: expected MISSING but got '{got_cal}'")
            where.append("switch")
    else:
        if got_cal == "MISSING":
            issues.append(f"Calibre: expected '{exp_cal}' but switch is MISSING")
            where.append("sticker")

        elif exp_cal != got_cal:
            issues.append(f"Calibre: expected '{exp_cal}' got '{got_cal}'")
            where.append("switch")

    return len(issues) == 0, issues, where

# ─────────────────────────────────────────────
# PHASE 1: LAYOUT MAPPING (Whole Panel)
# ─────────────────────────────────────────────


def group_into_rows_smart(boxes):
    if not boxes:
        return []
    boxes = sorted(boxes, key=lambda b: (b["y1"] + b["y2"]) / 2)
    cys = [(b["y1"] + b["y2"]) / 2 for b in boxes]
    gaps = [cys[i+1] - cys[i] for i in range(len(cys)-1)]
    if not gaps:
        return [sorted(boxes, key=lambda b: b["x1"])]
    mean_gap = sum(gaps) / len(gaps)
    gap_thresh = mean_gap * 3
    rows = []
    current_row = [boxes[0]]
    for i, box in enumerate(boxes[1:]):
        if gaps[i] > gap_thresh:
            rows.append(sorted(current_row, key=lambda b: b["x1"]))
            current_row = [box]
        else:
            current_row.append(box)
    rows.append(sorted(current_row, key=lambda b: b["x1"]))
    return rows


def get_row_type(row):
    return Counter(b["class_name"] for b in row).most_common(1)[0][0]

def pair_switches_to_stickers(sticker_row, switch_row):
    pairs = [{"sticker": s, "switches": []} for s in sticker_row]
    if not switch_row:
        return pairs

    sorted_stickers = sorted(range(len(sticker_row)),
                             key=lambda i: cx(sticker_row[i]))
    sorted_switches = sorted(switch_row, key=lambda b: cx(b))

    widths    = [b["x2"] - b["x1"] for b in sticker_row]
    avg_width = sum(widths) / len(widths)

    def is_wide_sticker(box):
        return (box["x2"] - box["x1"]) > avg_width * 1.5

    if len(sorted_switches) >= 2:
        switch_cxs  = [cx(sw) for sw in sorted_switches]
        gaps        = [switch_cxs[i+1] - switch_cxs[i]
                       for i in range(len(switch_cxs)-1)]
        normal_gaps = [g for g in gaps if g < max(gaps) * 0.7]
        avg_gap     = sum(normal_gaps) / len(normal_gaps) if normal_gaps else 140
    else:
        avg_gap = 140

    max_dist = avg_gap * 0.75
    sw_idx   = 0

    for st_idx in sorted_stickers:
        sticker = sticker_row[st_idx]
        if sw_idx >= len(sorted_switches):
            continue

        dist = abs(cx(sticker) - cx(sorted_switches[sw_idx]))
        if dist <= max_dist:
            pairs[st_idx]["switches"].append(sorted_switches[sw_idx])
            sw_idx += 1
            if is_wide_sticker(sticker) and sw_idx < len(sorted_switches):
                next_sw = sorted_switches[sw_idx]
                if cx(next_sw) <= sticker["x2"] + 30:
                    pairs[st_idx]["switches"].append(next_sw)
                    sw_idx += 1

    for p in pairs:
        p["switches"] = sorted(p["switches"], key=lambda b: b["x1"])

    return pairs


def scan_layout(panel_image_path):
    """
    Simulates Step 1: Taking the picture of the whole board just to count 
    how many logical pairs of (Sticker+Switch) rows exist. 
    It DOES NOT read text.
    """
    print(f"\n[PHASE 1] Scanning whole panel layout: {panel_image_path}...")
    img = cv2.imread(panel_image_path)
    if img is None:
        raise FileNotFoundError("Cannot load image")

    results = detect_model(img, verbose=False)
    all_boxes = []
    for r in results:
        for det in r.boxes:
            conf = float(det.conf[0])
            if conf < 0.5:
                continue

            box = {"x1": int(det.xyxy[0][0]), "y1": int(det.xyxy[0][1]),
                   "x2": int(det.xyxy[0][2]), "y2": int(det.xyxy[0][3]),
                   "class_name": detect_model.names[int(det.cls[0])], "conf": conf}
            all_boxes.append(box)

    rows = group_into_rows_smart(all_boxes)
    row_pairs = []  # simplified sequential check just for counting
    i = 0
    while i < len(rows):
        if i + 1 < len(rows):
            if get_row_type(rows[i]) != get_row_type(rows[i+1]):
                sticker_row = rows[i] if get_row_type(rows[i]) == STICKER_CLASS_NAME else rows[i+1]
                switch_row  = rows[i] if get_row_type(rows[i]) == SWITCH_CLASS_NAME else rows[i+1]
                
                row_pairs.append((sticker_row, switch_row))
                i += 2
                continue
        i += 1

    position_map = {}

    for pair_idx, (sticker_row, switch_row) in enumerate(row_pairs, start=1):
        if not sticker_row:
            continue
        pairs = pair_switches_to_stickers(sticker_row, switch_row)
        for slot_idx, pair in enumerate(pairs, start=1):
            slot_id = f"R{pair_idx}-S{slot_idx}"
            # Use sticker bbox as the anchor
            st = pair["sticker"]
            switches = pair["switches"]  # could be 0, 1, or 2 switches

            if switches:
                # Span from leftmost to rightmost switch
                sw_x1 = min(sw["x1"] for sw in switches)
                sw_y1 = min(sw["y1"] for sw in switches)
                sw_x2 = max(sw["x2"] for sw in switches)
                sw_y2 = max(sw["y2"] for sw in switches)
            else:
                sw_x1 = sw_y1 = sw_x2 = sw_y2 = None

            position_map[slot_id] = {
                "sticker_x1": st["x1"], "sticker_y1": st["y1"],
                "sticker_x2": st["x2"], "sticker_y2": st["y2"],
                "switch_x1": sw_x1,
                "switch_y1": sw_y1,
                "switch_x2": sw_x2,
                "switch_y2": sw_y2,
            }
    
    h, w = img.shape[:2]
    print(
        f"✅ Layout successfully mapped. Panel has exactly {len(row_pairs)} row pairs.\n")
    return len(row_pairs), position_map, h, w

# ─────────────────────────────────────────────
# PHASE 2: LINEAR READER & VALIDATOR (Single Row)
# ─────────────────────────────────────────────


def cx(box): return (box["x1"] + box["x2"]) / 2


def extract_only_id(raw_text):
    pattern = r'\b\d+[A-Za-z0]+\d+\b'
    matches = re.findall(pattern, raw_text)
    if matches:
        code      = matches[0]
        corrected = re.sub(r'(?<=\d)0(?=\d{2,}$)', 'Q', code)
        corrected = re.sub(r'(?<=\d)Q(?=Q\d{2,}$)', '0', corrected)
        return corrected
    tokens = raw_text.strip().split()
    print("OCR fallback tokens:", tokens)
    return tokens[0] if tokens else "UNKNOWN"

def clean_for_ocr(image):
    # # 1. transform image in Grayscale
    # gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # # 2. Apply Otsu's thresholding to convert to black & white (binary)
    # # Using THRESH_BINARY_INV because OCR works best with dark text on light background
    # _, thresh_img = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    # image_resized = cv2.resize(image ,dsize=None,fx=3,fy=3, interpolation=cv2.INTER_CUBIC)
    
    scale = max(1, int(40 / max(image.shape[0], 1)))
    if scale > 1:
        image_resized = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        return image_resized
    else :
        return image

def read_sticker_raw(img, box):
    pad = 4
    x1, y1, x2, y2 = max(0, int(box["x1"]-pad)), max(0, int(box["y1"]-pad)), min(
        img.shape[1], int(box["x2"]+pad)), min(img.shape[0], int(box["y2"]+pad))
    crop_img = img[y1:y2, x1:x2]

    cleaned_image = clean_for_ocr(crop_img)
    result       = ocr.ocr(cleaned_image, cls=False)
    full_text    = ""
    if result and result[0]:
        lines     = [line[1][0] for line in result[0] if line[1][0]]
        full_text = " ".join(lines)
    return full_text


def read_switch_digit(img, box):
    x1, y1, x2, y2 = max(0, int(box["x1"])), max(0, int(box["y1"])), min(
        img.shape[1], int(box["x2"])), min(img.shape[0], int(box["y2"]))
    results = digit_model(img[y1:y2, x1:x2], verbose=False)
    digits = []
    for r in results:
        for det in r.boxes:
            if float(det.conf[0]) >= 0.4:
                digits.append(
                    (int(det.xyxy[0][0]), digit_model.names[int(det.cls[0])]))
    return "".join(d[1] for d in sorted(digits, key=lambda d: d[0])) if digits else "MISSING"


def scan_single_row(row_img_path, row_index):
    """
    Simulates Step 2 & 3: Extracts clear data left-to-right from a cropped 
    image of ONE ROW, and checks the results directly against blueprint.json.
    """

    ref_lookup = build_validation_lookup(REFERENCE_JSON)

    img = cv2.imread(row_img_path)
    if img is None:
        print(f"Skipping: Row image {row_img_path} missing.")
        return []

    print(f"[PHASE 2 & 3] Processing ROW {row_index:02d}: {row_img_path}")
    print("-" * 75)

    # 1. High Resolution Row Detection
    results = detect_model(img, verbose=False)
    print(f"  Detected {len(results[0].boxes)} objects in Row {row_index}.")
    stickers, switches = [], []
    for r in results:
        for det in r.boxes:
            if float(det.conf[0]) < 0.25:
                continue
            box = {"x1": int(det.xyxy[0][0]), "y1": int(det.xyxy[0][1]),
                   "x2": int(det.xyxy[0][2]), "y2": int(det.xyxy[0][3])}

            name = detect_model.names[int(det.cls[0])]

            if name == "sticker":
                stickers.append(box)
            elif name == "switch":
                switches.append(box)

    # 2. Sort Left to Right
    stickers = sorted(stickers, key=cx)
    switches = sorted(switches, key=cx)

    # 3. Geometric Pairing (Solves the "Wide Sticker" multiple switches problem!)
    pairs = [{"sticker": st, "switches": []} for st in stickers]

    for sw in switches:
        if not stickers:
            break
        # Find the closest sticker object
        best_idx, best_st = min(enumerate(stickers),
                                key=lambda item: abs(cx(item[1]) - cx(sw)))

        # Check actual pixel distance
        dist = abs(cx(best_st) - cx(sw))
        if dist < 120:
            pairs[best_idx]["switches"].append(sw)

    row_results = []

    # 4. Read & Validate Pairs
    for i, pair in enumerate(pairs):
        slot_id = f"R{row_index}-S{i+1}"

        # Read the single sticker
        sticker_code = extract_only_id(read_sticker_raw(img, pair["sticker"]))

        # Process 0, 1, or multiple switches assigned to it!
        if not pair["switches"]:
            calibre = "MISSING"
        else:
            # Re-sort paired switches perfectly left to right
            sorted_sw = sorted(pair["switches"], key=cx)
            # Read digits, join them with a hyphen if multiple (e.g. 15-15)
            digits = [read_switch_digit(img, sw) for sw in sorted_sw]
            calibre = "-".join(digits) if len(digits) > 1 else digits[0]

        # Validate instantly
        passed, issues, where = validate_record(
            slot_id, sticker_code, calibre, ref_lookup)

        status_symbol = "✅" if passed else "❌"
        msg = "OK" if passed else " | ".join(issues)

        print(
            f"  Slot {i+1:02d} | ID: {sticker_code:<8} | SW: {calibre:<7} {status_symbol} {msg}")

        ref = ref_lookup.get(slot_id, {})

        row_results.append({
            "slot_id": slot_id,
            "status": "PASS" if passed else "FAIL",
            "scanned_calibre": calibre,
            "scanned_identification": sticker_code,
            "expected_calibre": ref.get("expected_calibre", "?"),
            "expected_identification": ref.get("expected_identification", "?"),
            "message": msg,
            "where": where
        })
    

    print("-" * 75)
    return row_results


# ─────────────────────────────────────────────
# SIMULATE THE NEW FRONTEND-BACKEND WORKFLOW
# ─────────────────────────────────────────────
if __name__ == "__main__":
    # --- PUT YOUR IMAGES HERE ---
    WHOLE_PANEL_IMAGE = "cc.jpg"  # Picture of the full board
    # Add your individual cropped row pictures below
    # (If you don't have them yet, copy your row5 image path 5 times just to watch it loop!)
    ROW_IMAGES_LIST = [
        "row1_test.jpg",  # Path to Row 1 cropped image
        "row2_test.jpg",
        "row3_test.jpg",
        "row4_test.jpg",
        "row5_test.jpg"  # e.g., the high-res one you used earlier
    ]

    ref_lookup = build_validation_lookup(REFERENCE_JSON)

    print("=== ALSTOM INSPECTION INITIALIZED ===")

    # 1. Frontend sends whole board
    num_rows = scan_layout(WHOLE_PANEL_IMAGE)

    all_panel_results = []

    # 2. Frontend takes 5 distinct pictures sequentially and backend evaluates instantly
    # We will loop only up to however many layout rows Phase 1 calculated
    for i in range(1, num_rows + 1):
        if i <= len(ROW_IMAGES_LIST):
            current_row_image = ROW_IMAGES_LIST[i-1]
            row_data = scan_single_row(
                current_row_image, row_index=i)
            all_panel_results.extend(row_data)
        else:
            print(f"⚠️  Frontend failed to upload image for Row {i}.")

    # 3. Print Final Summary from combined database
    print("\n" + "=" * 50)
    print("   FINAL GLOBAL PANEL SUMMARY")
    print("=" * 50)
    failed = [r for r in all_panel_results if r["status"] == "FAIL"]

    print(f"Total Evaluated: {len(all_panel_results)}")
    print(f"✅ PASSED : {len(all_panel_results) - len(failed)}")
    print(f"❌ FAILED : {len(failed)}")
    if failed:
        print("\nERROR BREAKDOWN:")
        for err in failed:
            print(f"  • {err['slot_id']} : {err['message']}")
    print("=" * 50)
