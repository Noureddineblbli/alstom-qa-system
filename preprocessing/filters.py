import cv2
import matplotlib.pyplot as plt

def clean_for_ocr(crop_image_path):
    # 1. Load image in Grayscale
    img = cv2.imread(crop_image_path, cv2.IMREAD_GRAYSCALE)
    
    # 2. Apply Otsu's thresholding to convert to black & white (binary)
    # Using THRESH_BINARY_INV because OCR works best with dark text on light background
    _, thresh_img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Save the cleaned image to test
    cleaned_path = crop_image_path.replace(".jpg", "_cleaned.jpg")
    cv2.imwrite(cleaned_path, thresh_img)
    
    return img, thresh_img, cleaned_path

def clean_switch_for_ocr(crop_image_path):
    img = cv2.imread(crop_image_path)
    h, w = img.shape[:2]
    
    # Take only bottom 35% where the number is
    bottom = img[int(h * 0.65):h, 0:w]
    
    # Upscale
    bottom = cv2.resize(bottom, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    
    # Invert (white text on black -> black text on white)
    inverted = cv2.bitwise_not(bottom)
    
    # Grayscale
    gray = cv2.cvtColor(inverted, cv2.COLOR_BGR2GRAY)
    
    # Threshold
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Save
    cleaned_path = crop_image_path.replace(".jpg", "_switch_cleaned.jpg")
    cv2.imwrite(cleaned_path, thresh)
    
    return cleaned_path

def clean_switch_for_calibre(crop_image_path):
    img = cv2.imread(crop_image_path)
    if img is None:
        return None
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Crop bottom 50% to remove the O button distraction
    h, w = gray.shape
    cropped = gray[int(h * 0.5):h, 0:w]
    
    # CLAHE contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(cropped)
    
    # Gaussian blur
    blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)
    
    # Invert
    inverted = cv2.bitwise_not(blurred)
    
    # Save
    cleaned_path = crop_image_path.replace(".jpg", "_calibre_cleaned.jpg")
    cv2.imwrite(cleaned_path, inverted)
    
    return cleaned_path

# --- TEST BLOCK ---
if __name__ == "__main__":
    # Ensure you have a file named 'sample_crop.jpg' in your root or preprocessing/
    # If not, use one of the files we just created in the last step!
    img_path = "preprocessing/crops/pair_0_switch.jpg" 
    
    original, cleaned, saved_at = clean_for_ocr(img_path)
    
    # Show side by side using Matplotlib
    plt.subplot(1, 2, 1)
    plt.title("Original")
    plt.imshow(original, cmap='gray')
    
    plt.subplot(1, 2, 2)
    plt.title("Cleaned for OCR")
    plt.imshow(cleaned, cmap='gray')
    
    plt.show()
    print(f"Cleaned image saved at: {saved_at}")