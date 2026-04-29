import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import os, uuid
from fastapi.middleware.cors import CORSMiddleware
from run_test import analyse_panel, scan_panel_overview
from analyze_panel import scan_layout, scan_single_row
import base64


# Initialize the FastAPI app
app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://vashti-kilometrical-lili.ngrok-free.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # or ["*"] for quick test
    allow_credentials=True,
    allow_methods=["*"],     # includes OPTIONS (important for preflight)
    allow_headers=["*"],
)

# 2. Define the POST endpoint
@app.post("/api/validate_slot")
async def validate_slot(file: UploadFile = File(...)):

    file_id = f"{uuid.uuid4()}.jpg"
    image_path = os.path.join('frontend\pictures', file_id)

    contents = await file.read()
    with open(image_path, "wb") as f:
        f.write(contents)

    # contents = await file.read()
    # image = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)  # decode in memory

    # now you have image_path → reuse existing logic
    try:
        results, h, w = analyse_panel(image_path)
        return {
            "status": "SUCCESS",
            "validation_results": results,
            "image_height": h,
            "image_width": w,
        }

    except Exception as e:
        return {
            "status": "ERROR",
            "message": str(e)
        }


# ── NEW: Overview scan → row count + position map ────────────────────────────
@app.post("/api/scan_overview")
async def scan_overview(file: UploadFile = File(...)):
    file_id = f"{uuid.uuid4()}.jpg"
    image_path = os.path.join('frontend/pictures', file_id)

    contents = await file.read()
    with open(image_path, "wb") as f:
        f.write(contents)

    # with open("cc.jpg", "rb") as img_file:
    #     encoded = base64.b64encode(img_file.read()).decode("utf-8")

    try:
        row_count, position_map, h, w = scan_layout(image_path)
        return {
            "status": "SUCCESS",
            "row_count": row_count,
            "position_map": position_map,   # { "R1-S1": {x1,y1,x2,y2}, ... }
            "image_width": w,   
            "image_height": h,
            # "image_base64": encoded
        }
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}


# ── NEW: Validate a single row image ─────────────────────────────────────────
@app.post("/api/validate_row")
async def validate_row(
    file: UploadFile = File(...),
    row_index: int = Form(...)          # which row number this photo is
):
    file_id = f"{uuid.uuid4()}.jpg"
    image_path = os.path.join('frontend/pictures', file_id)

    contents = await file.read()
    with open(image_path, "wb") as f:
        f.write(contents)

    # if row_index == 1:
    #     image_path = "row1_test.jpg"
    # elif row_index == 2:
    #     image_path = "row2_test.jpg"
    # elif row_index == 3:
    #     image_path = "row3_test.jpg"
    # elif row_index == 4:
    #     image_path = "row4_test.jpg"
    # elif row_index == 5:
    #     image_path = "row5_test.jpg"

    try:
        results = scan_single_row(image_path, row_index=row_index)
        return {
            "status": "SUCCESS",
            "row_index": row_index,
            "validation_results": results
        }
    except ValueError as e:
        if str(e) == "NO_DETECTIONS":
            return {
                "status": "INVALID_IMAGE",
                "row_index": row_index,
                "message": "No panel components detected. Please retake this row."
            }
        return {"status": "ERROR", "row_index": row_index, "message": str(e)}
    except Exception as e:
        return {"status": "ERROR", "row_index": row_index, "message": str(e)}

# How to run: 
# uvicorn backend.main:app --reload