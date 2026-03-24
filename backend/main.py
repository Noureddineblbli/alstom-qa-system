from fastapi import FastAPI
from pydantic import BaseModel
from backend.pipeline import run_pipeline

# Initialize the FastAPI app
app = FastAPI()

# 1. Define the input data structure
class ImageValidationInput(BaseModel):
    image_path: str
    row_id: str

# 2. Define the POST endpoint
@app.post("/api/validate_slot")
async def validate_slot(input_data: ImageValidationInput):
    try:
        results = run_pipeline(input_data.image_path)
        return {
            "status": "SUCCESS",
            "row_id": input_data.row_id,
            "image_path": input_data.image_path,
            "validation_results": results
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "message": str(e)
        }

# How to run: 
# uvicorn backend.main:app --reload