def validate_record(slot_id, identification, calibre, ref_lookup):
    ref = ref_lookup.get(slot_id)
    if not ref:
        return False, [f"⚠️  No reference found for '{slot_id}'"], []

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
