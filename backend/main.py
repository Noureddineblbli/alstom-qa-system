import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import os, uuid
from fastapi.middleware.cors import CORSMiddleware
from run_test import analyse_panel

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

# How to run: 
# uvicorn backend.main:app --reload