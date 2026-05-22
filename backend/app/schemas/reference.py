from pydantic import BaseModel
from datetime import datetime
from typing import List

class ReferenceSlotResponse(BaseModel):
    slotId: str
    identification_id: str
    amperage: str

    class Config:
        from_attributes = True

class ReferenceCreate(BaseModel):
    ref_id: str
    project_id: int

class ReferenceUpdate(BaseModel):
    new_project_id: int

class ReferenceResponse(BaseModel):
    ref_id: str
    project_id: int
    created_at: datetime
    created_by: str
    email: str

    class Config:
        from_attributes = True

class ReferenceDetailResponse(BaseModel):
    ref_id: str
    project_id: int
    created_at: datetime
    created_by: int
    slots: List[ReferenceSlotResponse]

    class Config:
        from_attributes = True

class SlotUpdate(BaseModel):
    slotId: str
    identification_id: str
    amperage: str

class BulkSlotUpdateRequest(BaseModel):
    slots: List[SlotUpdate]