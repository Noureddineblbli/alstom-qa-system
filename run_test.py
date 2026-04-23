from email.mime import image

import cv2
import re

from matplotlib import scale
from ultralytics import YOLO
from paddleocr import PaddleOCR
from collections import Counter
import json

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
IMAGE_PATH         = "172.JPG"
DETECTION_MODEL    = "detection/weights/sticker_switch_detection.pt"
DIGIT_MODEL        = "detection/digit_recognition.pt"
STICKER_CLASS_NAME = "sticker"
SWITCH_CLASS_NAME  = "switch"
REFERENCE_JSON     = "data/blueprint.json"

# ─────────────────────────────────────────────
# INIT
# ─────────────────────────────────────────────
ocr          = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
detect_model = YOLO(DETECTION_MODEL)
digit_model  = YOLO(DIGIT_MODEL)

# ─────────────────────────────────────────────
# SMART ROW GROUPING
# ─────────────────────────────────────────────

def group_into_rows_smart(boxes):
    if not boxes:
        return []
    boxes = sorted(boxes, key=lambda b: (b["y1"] + b["y2"]) / 2)
    cys   = [(b["y1"] + b["y2"]) / 2 for b in boxes]
    gaps  = [cys[i+1] - cys[i] for i in range(len(cys)-1)]
    if not gaps:
        return [sorted(boxes, key=lambda b: b["x1"])]
    mean_gap   = sum(gaps) / len(gaps)
    gap_thresh = mean_gap * 3
    rows        = []
    current_row = [boxes[0]]
    for i, box in enumerate(boxes[1:]):
        if gaps[i] > gap_thresh:
            rows.append(sorted(current_row, key=lambda b: b["x1"]))
            current_row = [box]
        else:
            current_row.append(box)
    rows.append(sorted(current_row, key=lambda b: b["x1"]))
    return rows

# ─────────────────────────────────────────────
# SEQUENTIAL ROW PAIRING
# ─────────────────────────────────────────────

def get_row_type(row):
    return Counter(b["class_name"] for b in row).most_common(1)[0][0]


def pair_rows_sequential(rows):
    pairs = []
    i = 0
    while i < len(rows):
        if i + 1 < len(rows):
            row_a  = rows[i]
            row_b  = rows[i + 1]
            type_a = get_row_type(row_a)
            type_b = get_row_type(row_b)
            if type_a == STICKER_CLASS_NAME and type_b == SWITCH_CLASS_NAME:
                pairs.append((row_a, row_b))
                i += 2
            elif type_a == SWITCH_CLASS_NAME and type_b == STICKER_CLASS_NAME:
                pairs.append((row_b, row_a))
                i += 2
            elif type_a == STICKER_CLASS_NAME and type_b == STICKER_CLASS_NAME:
                pairs.append((row_a, []))
                i += 1
            else:
                pairs.append(([], row_a))
                i += 1
        else:
            row   = rows[i]
            rtype = get_row_type(row)
            pairs.append((row, []) if rtype == STICKER_CLASS_NAME else ([], row))
            i += 1
    return pairs

# ─────────────────────────────────────────────
# SWITCH → STICKER PAIRING
# ─────────────────────────────────────────────

def cx(box):
    return (box["x1"] + box["x2"]) / 2


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

# ─────────────────────────────────────────────
# OCR + DIGIT HELPERS
# ─────────────────────────────────────────────

def extract_sticker_code(text):
    pattern = r'\b\d+[A-Za-z0]+\d+\b'
    matches = re.findall(pattern, text)
    if matches:
        code      = matches[0]
        corrected = re.sub(r'(?<=\d)0(?=\d{2,}$)', 'Q', code)
        corrected = re.sub(r'(?<=\d)Q(?=Q\d{2,}$)', '0', corrected)
        return corrected
    tokens = text.strip().split()
    return tokens[0] if tokens else "?"

def crop(image, box, pad=4):
    h, w = image.shape[:2]
    x1 = max(0, int(box["x1"]) - pad)
    y1 = max(0, int(box["y1"]) - pad)
    x2 = min(w, int(box["x2"]) + pad)
    y2 = min(h, int(box["y2"]) + pad)
    # cv2.imwrite("debug_crops/crop_{}_{}.jpg".format(box["class_name"], box["conf"]), image[y1:y2, x1:x2])
    return image[y1:y2, x1:x2]

def read_switch_digit(image, box):
    switch_crop = crop(image, box)
    results     = digit_model(switch_crop, verbose=False)
    digits      = []
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
        return "?"
    return "".join(d[1] for d in sorted(digits, key=lambda d: d[0]))

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

def read_sticker_text(image, box):
    sticker_crop = crop(image, box)
    cleaned_image = clean_for_ocr(sticker_crop)
    result       = ocr.ocr(cleaned_image, cls=True)
    full_text    = ""
    if result and result[0]:
        lines     = [line[1][0] for line in result[0] if line[1][0]]
        full_text = " ".join(lines)
    return extract_sticker_code(full_text)

# ─────────────────────────────────────────────
# VALIDATION
# ─────────────────────────────────────────────

def build_validation_lookup(reference_json_path):
    """Load reference JSON and return a lookup dict keyed by slot_id."""
    with open(reference_json_path, "r") as f:
        reference = json.load(f)
    return {item["slot_id"]: item for item in reference}

def is_real_switch(image, box):
    """
    A real switch always has a readable digit.
    If digit model finds nothing → it's an empty slot, not a switch.
    """
    switch_crop = crop(image, box)
    results     = digit_model(switch_crop, verbose=False)
    for r in results:
        if len(r.boxes) > 0 and float(r.boxes[0].conf[0]) >= 0.7:
            return True   # digit found → real switch
    return False          # no digit → empty slot

def validate_record(slot_id, identification, calibre, ref_lookup):
    """
    Validate a single record against reference.
    Returns (passed: bool, issues: list of strings)
    """
    ref = ref_lookup.get(slot_id)
    if not ref:
        return False, [f"⚠️  No reference found for slot '{slot_id}'"]

    exp_id  = ref["expected_identification"].strip().upper()
    exp_cal = ref["expected_calibre"].strip().upper()
    got_id  = identification.strip().upper()
    got_cal = calibre.strip().upper()

    issues = []
    # elements = []

    # Validate identification
    if exp_id != got_id:
        issues.append(f"Identification: expected '{exp_id}' got '{got_id}'")
        #elements.append("sticker")

    # Validate calibre
    if exp_cal == "MISSING":
        if got_cal != "MISSING":
            issues.append(f"Calibre: expected MISSING but got '{got_cal}'")
            #elements.append("switch")
    else:
        if got_cal == "MISSING":
            issues.append(f"Calibre: expected '{exp_cal}' but switch is MISSING")
            #elements.append("sticker")
        elif exp_cal != got_cal:
            issues.append(f"Calibre: expected '{exp_cal}' got '{got_cal}'")
            #elements.append("switch")

    return len(issues) == 0, issues

# ─────────────────────────────────────────────
# DEBUG DRAW
# ─────────────────────────────────────────────

def draw_debug(image, all_boxes):
    debug  = image.copy()
    colors = {"sticker": (0, 255, 0), "switch": (0, 0, 255)}
    for box in all_boxes:
        c          = colors.get(box["class_name"], (200, 200, 0))
        x1, y1, x2, y2 = (int(box["x1"]), int(box["y1"]),
                           int(box["x2"]), int(box["y2"]))
        cv2.rectangle(debug, (x1, y1), (x2, y2), c, 2)
        label = f'{box["class_name"]} {box["conf"]:.2f}'
        cv2.putText(debug, label, (x1, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, c, 1)
    cv2.imwrite("debug_detections.jpg", debug)
    print(f"[DEBUG] Saved → debug_detections.jpg")
    print(f"[DEBUG] Total boxes : {len(all_boxes)}")
    print(f"[DEBUG] Stickers    : {sum(1 for b in all_boxes if b['class_name'] == 'sticker')}")
    print(f"[DEBUG] Switches    : {sum(1 for b in all_boxes if b['class_name'] == 'switch')}")

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def analyse_panel(image_path):
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found")

    # ── Detect ───────────────────────────────────────────────────────────────
    det_results = detect_model(image, verbose=False)
    all_boxes   = []
    for r in det_results:
        for det in r.boxes:
            cls_id     = int(det.cls[0])
            class_name = detect_model.names[cls_id]
            x1, y1, x2, y2 = det.xyxy[0].tolist()
            conf = float(det.conf[0])
            all_boxes.append({
                "x1": x1, "y1": y1,
                "x2": x2, "y2": y2,
                "class_name": class_name,
                "conf": conf
            })
    all_boxes = [b for b in all_boxes if b["conf"] >= 0.7]
    # ── Filter out empty slots masquerading as switches ───────────────────
    filtered_boxes = []
    for box in all_boxes:
        if box["class_name"] == SWITCH_CLASS_NAME:
            if is_real_switch(image, box):
                filtered_boxes.append(box)
        else:
            filtered_boxes.append(box)
    all_boxes = filtered_boxes
    draw_debug(image, all_boxes)

    if not all_boxes:
        print("No objects detected.")
        return

    # ── Smart row grouping ────────────────────────────────────────────────────
    rows = group_into_rows_smart(all_boxes)

    # ── Sequential pairing ────────────────────────────────────────────────────
    row_pairs = pair_rows_sequential(rows)

    # ── Load reference ────────────────────────────────────────────────────────
    ref_lookup   = build_validation_lookup(REFERENCE_JSON)
    total        = 0
    total_failed = 0
    all_issues   = []
    results      = []

    # ── Print results with inline validation ──────────────────────────────────
    print("=" * 70)
    print(f"  PANEL ANALYSIS — {image_path}")
    print(f"  Rows detected : {len(rows)}")
    print(f"  Row pairs     : {len(row_pairs)}")
    print("=" * 70)

    for pair_idx, (sticker_row, switch_row) in enumerate(row_pairs, start=1):
        print(f"\nRow Pair {pair_idx:02d}:")
        print("-" * 60)

        if not sticker_row:
            for idx, sw_box in enumerate(switch_row, start=1):
                digit = read_switch_digit(image, sw_box)
                print(f"  Record {idx:02d}: UNKNOWN: [{digit}]")
            continue

        pairs = pair_switches_to_stickers(sticker_row, switch_row)

        for idx, pair in enumerate(pairs, start=1):
            slot_id      = f"R{pair_idx}-S{idx}"
            sticker_code = read_sticker_text(image, pair["sticker"])

            if not pair["switches"]:
                switch_str = "MISSING"
                calibre    = "MISSING"
            else:
                digits     = [read_switch_digit(image, sw)
                              for sw in pair["switches"]]
                switch_str = ", ".join(digits)
                calibre    = "-".join(digits) if len(digits) > 1 else digits[0]

            passed, issues = validate_record(
                slot_id, sticker_code, calibre, ref_lookup
            )
            total += 1

            # bbox = {}
            # if elements:
            #     for e in elements:
            #         bbox = {
            #         "x1": pair[e]["x1"],
            #         "y1": pair[e]["y1"],
            #         "x2": pair[e]["x2"],
            #         "y2": pair[e]["y2"] 
            #     }

            # ── Build result dict for frontend ────────────────────────────
            ref     = ref_lookup.get(slot_id, {})
            results.append({
                "slot_id":                slot_id,
                "status":                 "PASS" if passed else "FAIL",
                "scanned_calibre":        calibre,
                "scanned_identification": sticker_code,
                "expected_calibre":       ref.get("expected_calibre", "?"),
                "expected_identification": ref.get("expected_identification", "?"),
                "message":                " | ".join(issues) if issues else "OK",
                    # ── ADD THIS ──────────────────────────────────────────
                "bbox": {
                    "x1": pair["sticker"]["x1"],
                    "y1": pair["sticker"]["y1"],
                    "x2": pair["sticker"]["x2"],
                    "y2": pair["sticker"]["y2"] 
                } if not passed else None
            })

            if passed:
                print(f"  Record {idx:02d}: {sticker_code}: [{switch_str}]  ✅")
            else:
                issue_str = "  |  ".join(issues)
                print(f"  Record {idx:02d}: {sticker_code}: [{switch_str}]  ❌  {issue_str}")
                total_failed += 1
                all_issues.append(f"  [{slot_id}] {sticker_code}: [{switch_str}]")
                for iss in issues:
                    all_issues.append(f"    • {iss}")

    # ── Final summary ─────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  VALIDATION SUMMARY")
    print("=" * 70)
    if not all_issues:
        print("  ✅ ALL RECORDS PASSED!")
    else:
        for line in all_issues:
            print(line)
    print("-" * 70)
    print(f"  Total  : {total}")
    print(f"  ✅ Passed : {total - total_failed}")
    print(f"  ❌ Failed : {total_failed}")
    print("=" * 70)

    h, w = image.shape[:2]

    return results, h, w


if __name__ == "__main__":
    #image = cv2.imread(IMAGE_PATH)
    analyse_panel(IMAGE_PATH)