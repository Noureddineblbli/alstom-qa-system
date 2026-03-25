import cv2
import os

def capture_frame():
    # 1. Open the default camera (0 is usually the built-in webcam)
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Could not open camera.")
        return None

    print("📷 Camera activated! Press SPACEBAR to capture, or 'q' to quit.")
    
    # Define the save path relative to this script
    save_path = os.path.join(os.path.dirname(__file__), "temp_capture.jpg")

    while True:
        # 2. Read the camera feed frame by frame
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Failed to grab frame.")
            break

        # 3. Show the live preview
        cv2.imshow("Camera Preview - Press SPACE to capture", frame)

        # 4. Wait for key press
        key = cv2.waitKey(1) & 0xFF
        
        if key == 32:  # 32 is the ASCII code for the Spacebar
            cv2.imwrite(save_path, frame)
            print(f"✅ Frame captured and saved to: {save_path}")
            break
        elif key == ord('q'):  # Press 'q' to cancel
            print("🚫 Cancelled capture.")
            save_path = None
            break

    # 5. Clean up
    cap.release()
    cv2.destroyAllWindows()
    
    return save_path

# --- TEST BLOCK ---
if __name__ == "__main__":
    # Test the camera function by running this file directly
    path = capture_frame()
    if path and os.path.exists(path):
        print("🎉 Test successful! The camera script works perfectly.")