from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class InspectionStartRequest(BaseModel):
    project_id: int
    ref_id: str

class InspectionStartResponse(BaseModel):
    inspection_id: int
    ref_id: str

    class Config:
        from_attributes = True

class SlotResultResponse(BaseModel):
    slot_id: str
    status: str
    scanned_identification: str
    scanned_calibre: str
    message: str

class RowResultResponse(BaseModel):
    row_index: int
    row_status: str
    slots: List[SlotResultResponse]

class InspectionReportResponse(BaseModel):
    inspection_id: int
    verdict: str
    panel_image_path: str
    failed_slots: List[SlotResultResponse]

class InspectionListResponse(BaseModel):
    inspection_id: int
    project_name: str
    reference_id: str
    operator_name: str
    done_at: datetime
    verdict: str
    total_errors: int