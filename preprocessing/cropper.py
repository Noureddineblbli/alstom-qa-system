import cv2
import os
import numpy as np

def extract_crops(image_path, mapped_pairs):
    """
    Slices the original image based on mapped_pairs and saves individual chips.
    """
    # Load the image
    img = cv2.imread(image_path)
    
    if img is None:
        print(f"Error: Could not load image at {image_path}")
        return

    # Iterate through our grouped pairs from Step 2
    for idx, pair in enumerate(mapped_pairs):
        # Extract coordinates [x1, y1, x2, y2]
        s_box = pair['switch']['box'] # Switch
        t_box = pair['sticker']['box'] # Sticker
        
        # NumPy/OpenCV works as [y1:y2, x1:x2]
        # s_box[0]=x1, s_box[1]=y1, s_box[2]=x2, s_box[3]=y2
        switch_crop = img[int(s_box[1]):int(s_box[3]), int(s_box[0]):int(s_box[2])]
        sticker_crop = img[int(t_box[1]):int(t_box[3]), int(t_box[0]):int(t_box[2])]
        
        # Save them
        cv2.imwrite(f"preprocessing/crops/pair_{idx}_switch.jpg", switch_crop)
        cv2.imwrite(f"preprocessing/crops/pair_{idx}_sticker.jpg", sticker_crop)
        
        print(f"Saved crops for pair {idx}")

def run_test():
    # 1. Create a "dummy" image (blank black image) 1000x1000 pixels
    dummy_img = np.zeros((1000, 1000, 3), dtype=np.uint8)
    
    # 2. Add some "white boxes" into it so we can see if they are cropped correctly
    # Let's say: Box 1 is from x:100, y:100 to x:300, y:300
    dummy_img[100:300, 100:300] = 255 
    cv2.imwrite("test_input.jpg", dummy_img)
    
    # 3. Simulate mapped pairs from Intern B (the pairing logic)
    test_mapped_pairs = [
        {"switch": {"id": "test_sw1", "box": [100, 100, 300, 300]}, 
         "sticker": {"id": "test_st1", "box": [100, 100, 300, 300]}}
    ]
    
    # 4. Run our extract_crops function
    extract_crops("test_input.jpg", test_mapped_pairs)
    print("Test run complete. Check the preprocessing/crops folder for .jpg files.")

if __name__ == "__main__":
    run_test()

# We don't need a main execution block just yet, 
# as this will be called by your master processing pipeline.