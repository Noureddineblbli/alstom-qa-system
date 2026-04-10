from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from backend.pipeline import run_pipeline
import os, uuid
from fastapi.middleware.cors import CORSMiddleware

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

# 1. Define the input data structure
class ImageValidationInput(BaseModel):
    image : UploadFile
    row_id: str

# 2. Define the POST endpoint
@app.post("/api/validate_slot")
async def validate_slot(
    file: UploadFile = File(...),
    row_id: str = Form(...)
    ):

    file_id = f"{uuid.uuid4()}.jpg"
    file_path = os.path.join('frontend\pictures', file_id)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    # now you have image_path → reuse existing logic
    try:
        results = run_pipeline('frontend/temp_test_input.jpg')
        return {
            "status": "SUCCESS",
            "row_id": row_id,
            "image_path": file_path,
            "validation_results": results
        }

    except Exception as e:
        return {
            "status": "ERROR",
            "message": str(e)
        }

# How to run: 
# uvicorn backend.main:app --reload