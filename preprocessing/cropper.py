import cv2
import os

CROPS_DIR = os.path.join(os.path.dirname(__file__), 'crops')


def crop_box(image, box):
    x1, y1, x2, y2 = map(int, box)
    # Add a small padding to not cut off text
    h, w = image.shape[:2]
    x1, y1 = max(0, x1-2), max(0, y1-2)
    x2, y2 = min(w, x2+2), min(h, y2+2)
    return image[y1:y2, x1:x2]


def extract_crops(image_path, mapped_pairs, slot_index):
    """
    Extracts the sticker crop, and a crop for EVERY switch associated with that sticker.
    Returns the file paths of the saved crops.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")

    os.makedirs(CROPS_DIR, exist_ok=True)

    # We only process ONE pair (slot) at a time in the current pipeline loop
    pair = mapped_pairs[0]

    # 1. Crop and save the Sticker
    sticker_img = crop_box(img, pair["sticker"]['box'])
    sticker_path = os.path.join(CROPS_DIR, f"pair_{slot_index}_sticker.jpg")
    cv2.imwrite(sticker_path, sticker_img)

    # 2. Crop and save ALL Switches for this slot
    switch_paths = []
    for i, switch in enumerate(pair["switches"]):
        switch_img = crop_box(img, switch['box'])

        # If there's only 1 switch, name it normally. If multiple, add _1, _2, etc.
        suffix = f"_{i+1}" if len(pair["switches"]) > 1 else ""
        switch_path = os.path.join(
            CROPS_DIR, f"pair_{slot_index}_switch{suffix}.jpg")

        cv2.imwrite(switch_path, switch_img)
        switch_paths.append(switch_path)

    # Return the sticker path and the LIST of switch paths
    return sticker_path, switch_paths
