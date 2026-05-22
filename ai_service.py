import base64
import uuid

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, json

from ultralytics import settings
from analyze_panel_v2 import scan_layout, scan_single_row

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/scan-layout")
async def scan_layout_endpoint(file: UploadFile = File(...)):
    # folder = os.path.join(settings.UPLOAD_DIR, "panels")
    # os.makedirs(folder, exist_ok=True)
    # image_path = os.path.join(folder, f"inspection_{inspection_id}_panel.jpg")

    # contents = await file.read()
    # with open(image_path, "wb") as f:
    #     f.write(contents)

    with open("reference_panel_20260521_151710.jpg", "rb") as img_file:
        encoded = base64.b64encode(img_file.read()).decode("utf-8")

    temp_path = f"temp_panel_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    try:
        row_count, position_map, h, w = scan_layout("reference_panel_20260521_151710.jpg")
        return {
            "status": "SUCCESS",
            "row_count": row_count,   
            "position_map": position_map,   # { "R1-S1": {x1,y1,x2,y2}, ... }
            "image_width": w,   
            "image_height": h,
            "image_base64": encoded
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/scan-row")
async def scan_row_endpoint(
    file: UploadFile = File(...),
    row_index: int = Form(...),
    ref_lookup: str = Form("none"),
    use_case: str = Form("inspection")  # for reference management, default = 'none'
):
    temp_path = f"temp_row_{row_index}_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)


    if row_index == 1:
        image_path = "inspection_3_row_1.jpg"
    elif row_index == 2:
        image_path = "inspection_3_row_2.jpg"
    elif row_index == 3:
        image_path = "inspection_3_row_3.jpg"
    elif row_index == 4:
        image_path = "inspection_3_row_4.jpg"
    elif row_index == 5:
        image_path = "inspection_3_row_5.jpg"

    try:
        if use_case == "inspection":
            lookup = json.loads(ref_lookup)
        else:
            lookup = None
        results = scan_single_row(image_path, row_index, lookup)
        return results
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)