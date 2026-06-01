from collections import Counter
import cv2
from ai_service.config import detect_model
from ai_service.config import STICKER_CLASS_NAME, SWITCH_CLASS_NAME

def cx(box): return (box["x1"] + box["x2"]) / 2

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
            if conf < 0.8:
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
    print(f"✅ Layout successfully mapped. Panel has exactly {len(row_pairs)} row pairs.\n")
    print(f"Number of objects detected: {len(all_boxes)}")
    return len(row_pairs), position_map, h, w
