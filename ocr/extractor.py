from paddleocr import PaddleOCR
import os
import logging

logging.getLogger("ppocr").setLevel(logging.ERROR)

ocr_model = PaddleOCR(
    use_angle_cls=True,   # replaces use_textline_orientation
    lang='en',
    use_gpu=False         # replaces device='cpu'
)


def get_raw_text(crop_image_path):
    """
    Passes a cropped image to PaddleOCR and returns the highest-confidence text.
    """
    result = ocr_model.ocr(crop_image_path, cls=True)  # .ocr() not .predict()

    # Guard against empty or None results
    if not result or result[0] is None:
        return None, 0.0

    lines = result[0]

    highest_conf = -1.0
    best_text = ""

    for line in lines:
        try:
            text = line[1][0]
            confidence = line[1][1]
        except (IndexError, TypeError):
            continue

        if confidence > highest_conf:
            highest_conf = confidence
            best_text = text

    return best_text, highest_conf


# --- TEST BLOCK ---
if __name__ == "__main__":
    test_img = "preprocessing/crops/pair_0_switch.jpg"

    if os.path.exists(test_img):
        print(f"Running OCR on {test_img}...")
        extracted_text, conf = get_raw_text(test_img)
        if extracted_text:
            print(f"\n[RESULT] OCR Read: '{extracted_text}' with confidence {conf:.4f}")
        else:
            print("\n[RESULT] No text detected in the image.")
    else:
        print(f"Error: {test_img} not found! Check your path.")