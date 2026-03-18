from fastapi import FastAPI
from pydantic import BaseModel

# Initialize the FastAPI app
app = FastAPI()

# 1. Define the input data structure
class ScannedSlotInput(BaseModel):
    slot_id: str
    scanned_calibre: str
    scanned_identification: str

# 2. Define the POST endpoint
@app.post("/api/validate_slot")
async def validate_slot(input_data: ScannedSlotInput):
    # This is where the magic (comparison logic) will live soon.
    # For now, we "Mock" a success response.
    return {
        "status": "PASS",
        "message": f"Successfully received data for slot {input_data.slot_id}."
    }

# How to run: 
# uvicorn backend.main:app --reload