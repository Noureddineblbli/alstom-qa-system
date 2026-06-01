# ─────────────────────────────────────────────
# config.py
# Central configuration and model initialization.
# All other modules import from here — never load models elsewhere.
# ─────────────────────────────────────────────

from ultralytics import YOLO
from paddleocr import PaddleOCR

# ── Paths ──────────────────────────────────────
DETECTION_MODEL_PATH = "../detection/SwSt_RT-DETR.pt"
DIGIT_MODEL_PATH     = "../detection/Digit_Recognition_rt-edtr.pt"
REFERENCE_JSON_PATH  = "../data/blueprint.json"

# ── Class names (must match model training labels) ──
STICKER_CLASS_NAME = "sticker"
SWITCH_CLASS_NAME  = "switch"

# ── Model singletons (initialized once at import) ──
detect_model = YOLO(DETECTION_MODEL_PATH)
digit_model  = YOLO(DIGIT_MODEL_PATH)

ocr = PaddleOCR(
    use_angle_cls=True,
    lang="en",
    det_db_thresh=0.3,
    rec_batch_num=1,
    show_log=False,
)