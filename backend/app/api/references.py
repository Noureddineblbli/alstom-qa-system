import datetime
import os
from pathlib import Path
import shutil
from fastapi.responses import StreamingResponse

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from fastapi.responses import FileResponse
import httpx
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.reference import (
    ReferenceResponse,
    ReferenceDetailResponse,
    ReferenceSlotResponse,
    BulkSlotUpdateRequest,
    ReferenceUpdate
)
from app.services.reference_service import (
    get_all_references,
    get_reference_by_id,
    get_reference_slots,
    create_reference,
    delete_reference,
    update_reference,
    bulk_update_reference_slots,
    generate_reference_template
)
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.reference import Reference
from typing import List
from app.core.config import settings

AI_SERVICE_URL = "http://127.0.0.1:8001"

router = APIRouter(prefix="/api/references", tags=["References"])

@router.get("/", response_model=List[ReferenceResponse])
def list_references(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_all_references(db)


@router.get("/template")
def download_template(current_user: User = Depends(require_admin)):
    buffer = generate_reference_template()
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=reference_template.xlsx"}
    )


@router.get("/{ref_id}", response_model=ReferenceDetailResponse)
def get_reference(ref_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reference = get_reference_by_id(ref_id, db)
    if not reference:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reference not found")
    slots = get_reference_slots(ref_id, db)
    return {
        "ref_id": reference.ref_id,
        "project_id": reference.project_id,
        "created_at": reference.created_at,
        "created_by": reference.created_by,
        "slots": slots
    }


@router.post("/", response_model=ReferenceResponse)
def create_new_reference(
    project_id: int = Form(...),
    ref_code: str = Form(...),
    file: UploadFile = File(None),
    row_Results: str = Form("{}"),  # JSON string from frontend with row validation results
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    
    # print(f"DEBUG: raw type is {type(row_Results)}")
    # print(f"DEBUG: raw value is {row_Results}")
    if file:
        if not file.filename.endswith((".xlsx", ".csv")):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .xlsx and .csv files are allowed")
    try:
        reference = create_reference(ref_code, project_id, current_user.user_id, row_Results, file, db)

        user = db.query(User).filter(User.user_id == reference.created_by).first()

        return {
            "ref_id": reference.ref_id,
            "project_id": reference.project_id,
            "created_at": reference.created_at,
            "created_by": user.nom if user else None,
            "email": user.email if user else None
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{ref_id}")
def delete_existing_reference(ref_id: str, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    result = delete_reference(ref_id, db)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reference not found")
    return {"message": "Reference deleted successfully"}


@router.put("/{ref_id}")
def update(
    ref_id: str, 
    data: ReferenceUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
        
    reference = update_reference(ref_id, data.new_project_id, db)
    if not reference:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reference not found")
    
    user = (
        db.query(User.nom, User.email)
        .filter(User.user_id == reference.created_by)
        .first()
    )

    return {
        "ref_id": reference.ref_id,
        "project_id": reference.project_id,
        "created_at": reference.created_at,

        "created_by": user.nom if user else None,
        "email": user.email if user else None
    }


@router.put("/{ref_id}/slots", response_model=List[ReferenceSlotResponse])
def bulk_update_slots(
    ref_id: str,
    data: BulkSlotUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        updated_slots = bulk_update_reference_slots(ref_id, data.slots, db)
        return updated_slots
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.post("/scan-layout")
def upload_panel_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        # results = process_panel_image(file, db)
        # return results
        
        time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        folder = os.path.join(settings.UPLOAD_DIR, "panels")
        os.makedirs(folder, exist_ok=True)
        file_path = os.path.join(folder, f"reference_panel_{time}.jpg")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        with open(file_path, "rb") as f:
            response = httpx.post(
                f"{AI_SERVICE_URL}/scan-layout",
                files={"file": ("panel.jpg", f, "image/jpeg")},
                timeout=60.0
            )
        response.raise_for_status()

        data = response.json()
        row_count = data["row_count"]

        return row_count
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    

@router.post("/extract-row-data/{row_index}")
def upload_row_image(
    row_index: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:

        # Save the row image
        folder = os.path.join(settings.UPLOAD_DIR, "rows")
        os.makedirs(folder, exist_ok=True)
        file_path = os.path.join(
            folder, f"reference_row_{row_index}.jpg"
        )
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        with open(file_path, "rb") as f:
            response = httpx.post(
                f"{AI_SERVICE_URL}/scan-row",
                data={
                    "row_index": row_index,
                    "use_case" : "reference_management"
                },
                files={"file": ("row.jpg", f, "image/jpeg")},
                timeout=120.0
            )
        response.raise_for_status()
        return {
            "status": "SUCCESS", 
            "row_index": row_index, 
            "validation_results": response.json()
        }
        
    

        # result = process_row_image(row_index, file, db)
        # return {
        #     "status": "SUCCESS", 
        #     "row_index": row_index, 
        #     "validation_results": result
        # }
    
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
