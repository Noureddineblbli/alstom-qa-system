import cv2
from ai_service.config import detect_model
from ai_service.layout import cx
from ai_service.validation import validate_record
from ai_service.ocr_reader import read_sticker_raw, read_switch_digit, extract_only_id

def scan_single_row(row_img_path, row_index, ref_lookup):
    """
    Simulates Step 2 & 3: Extracts clear data left-to-right from a cropped 
    image of ONE ROW, and checks the results directly against blueprint.json.
    """

    # ref_lookup = build_validation_lookup(REFERENCE_JSON)

    img = cv2.imread(row_img_path)
    if img is None:
        print(f"Skipping: Row image {row_img_path} missing.")
        return []

    print(f"[PHASE 2 & 3] Processing ROW {row_index:02d}: {row_img_path}")
    print("-" * 100)

    # 1. High Resolution Row Detection
    results = detect_model(img, verbose=False)
    print(f"  Detected {len(results[0].boxes)} objects in Row {row_index}.")

    stickers, switches = [],[]
    for r in results:
        for det in r.boxes:
            if float(det.conf[0]) < 0.80:
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

    row_results =[]

    # 4. Read & Validate Pairs
    for i, pair in enumerate(pairs):
        slot_id = f"R{row_index}-S{i+1}"

        # Capture the raw OCR string before we clean it up so we can debug OCR failures!
        raw_text = read_sticker_raw(img, pair["sticker"])
        sticker_code = extract_only_id(raw_text)

        # Process 0, 1, or multiple switches assigned to it!
        if not pair["switches"]:
            calibre = "MISSING"
        else:
            # Re-sort paired switches perfectly left to right
            sorted_sw = sorted(pair["switches"], key=cx)
            # Read digits, join them with a hyphen if multiple (e.g. 15-15)
            digits =[read_switch_digit(img, sw) for sw in sorted_sw]
            calibre = "-".join(digits) if len(digits) > 1 else digits[0]
        
        if ref_lookup: # inspection use case

            # Validate instantly
            passed, issues, where = validate_record(
                slot_id, sticker_code, calibre, ref_lookup)

            status_symbol = "✅" if passed else "❌"
            msg = "OK" if passed else " | ".join(issues)

            print(f"  Slot {i+1:02d} | RAW: '{raw_text:<25}' | ID: {sticker_code:<8} | SW: {calibre:<7} {status_symbol} {msg}")

            try:
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
            except Exception as e:
                print(f"  Error processing {slot_id}: {e}")

        else: # reference management use case
            row_results.append({
                "slot_id": slot_id,
                "scanned_calibre": calibre,
                "scanned_identification": sticker_code,
            })
            print("reference management result:")
            print(f"  Slot {i+1:02d} | RAW: '{raw_text:<25}' | ID: {sticker_code:<8} | SW: {calibre:<7}")



    return row_results

