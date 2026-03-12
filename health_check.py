libraries = [
    ("ultralytics", "ultralytics"),
    ("cv2", "opencv-python"),
    ("paddle", "paddlepaddle"),
    ("paddleocr", "paddleocr"),
    ("fastapi", "fastapi"),
    ("uvicorn", "uvicorn"),
    ("streamlit", "streamlit"),
    ("pandas", "pandas"),
    ("openpyxl", "openpyxl"),
    ("PIL", "pillow"),
]

for module, name in libraries:
    try:
        __import__(module)
        print(f"[{name}] OK")
    except ImportError:
        print(f"[{name}] FAILED")