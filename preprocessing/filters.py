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