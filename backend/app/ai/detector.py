import httpx
import json

AI_SERVICE_URL = "http://127.0.0.1:8001"

def scan_layout(panel_image_path: str) -> int:
    with open(panel_image_path, "rb") as f:
        response = httpx.post(
            f"{AI_SERVICE_URL}/scan-layout",
            files={"file": ("panel.jpg", f, "image/jpeg")},
            timeout=1000.0
        )
    response.raise_for_status()
    return response.json()


def process_row(row_image_path: str, row_index: int, ref_lookup: dict) -> list:
    with open(row_image_path, "rb") as f:
        response = httpx.post(
            f"{AI_SERVICE_URL}/scan-row",
            data={
                "row_index": row_index,
                "ref_lookup": json.dumps(ref_lookup)
            },
            files={"file": ("row.jpg", f, "image/jpeg")},
            timeout=1000.0
        )
    response.raise_for_status()
    return response.json()


def build_ref_lookup(slots: list) -> dict:
    lookup = {}
    for slot in slots:
        lookup[slot.slotId] = {
            "slot_id": slot.slotId,
            "expected_identification": slot.identification_id,
            "expected_calibre": str(slot.amperage)
        }
    return lookup