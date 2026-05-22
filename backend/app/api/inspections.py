from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.inspection import (
    InspectionListResponse,
    InspectionStartRequest,
    InspectionStartResponse
)
from app.services.inspection_service import (
    start_inspection,
    process_panel_image,
    process_row_image,
    complete_inspection
)
from app.core.dependencies import get_current_user, require_admin, require_operator
from app.models.user import User
from app.services.inspection_service import get_all_inspections

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])

@router.get("/", response_model=List[InspectionListResponse])
def list_inspections(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return get_all_inspections(db)


@router.post("/start", response_model=InspectionStartResponse)
def start_new_inspection(
    data: InspectionStartRequest,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    inspection = start_inspection(
        operator_id=current_user.user_id,
        project_id=data.project_id,
        ref_id=data.ref_id,
        db=db
    )
    return inspection


@router.post("/{inspection_id}/panel")
def upload_panel_image(
    inspection_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    try:
        results = process_panel_image(inspection_id, file, db)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{inspection_id}/rows/{row_index}")
def upload_row_image(
    inspection_id: int,
    row_index: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    try:
        result = process_row_image(inspection_id, row_index, file, db)
        return {
            "status": "SUCCESS", 
            "row_index": row_index, 
            "validation_results": result
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


@router.post("/{inspection_id}/complete")
def complete_inspection_route(
    inspection_id: int,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db)
):
    try:
        report = complete_inspection(inspection_id, db)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{inspection_id}/report")
def get_inspection_report(
    inspection_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        report = complete_inspection(inspection_id, db)
        return report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )