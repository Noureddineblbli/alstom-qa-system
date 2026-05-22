import base64
import shutil
import os
from sqlalchemy.orm import Session
from app.models.inspection import Inspection
from app.models.error import Error
from app.models.reference_data import ReferenceData
from app.ai.detector import scan_layout, process_row, build_ref_lookup
from app.core.config import settings
from app.models.reference import Reference
from app.models.project import Project
from app.models.user import User


def start_inspection(operator_id: int, project_id: int, ref_id: int, db: Session):
    inspection = Inspection(
        done_by=operator_id,
        ref_id=ref_id
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return inspection


def save_panel_image(inspection_id: int, file) -> str:
    folder = os.path.join(settings.UPLOAD_DIR, "panels")
    os.makedirs(folder, exist_ok=True)
    file_path = os.path.join(folder, f"inspection_{inspection_id}_panel.jpg")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path


def process_panel_image(inspection_id: int, file, db: Session):
    image_path = save_panel_image(inspection_id, file)
    response = scan_layout(image_path)

    return response


def process_row_image(inspection_id: int, row_index: int, file, db: Session):
    inspection = db.query(Inspection).filter(
        Inspection.inspection_id == inspection_id
    ).first()
    if not inspection:
        raise ValueError("Inspection not found")

    # Save the row image
    folder = os.path.join(settings.UPLOAD_DIR, "rows")
    os.makedirs(folder, exist_ok=True)
    file_path = os.path.join(
        folder, f"inspection_{inspection_id}_row_{row_index}.jpg"
    )
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Build ref_lookup from database
    slots = db.query(ReferenceData).filter(
        ReferenceData.ref_id == inspection.ref_id
    ).all()
    ref_lookup = build_ref_lookup(slots)

    # Call AI to process the row
    row_results = process_row(file_path, row_index, ref_lookup)

    # Store only failed slots in ERROR table
    for result in row_results:
        if result["status"] == "FAIL":
            ref_slot = ref_lookup.get(result["slot_id"], {})
            error = Error(
                slotId=result["slot_id"],
                inspection_id=inspection_id,
                extracted_id=result["scanned_identification"],
                expected_id=ref_slot.get("expected_identification", ""),
                extracted_amp=str(result["scanned_calibre"]),
                expected_amp=str(ref_slot.get("expected_calibre", ""))
            )
            db.add(error)

    db.commit()
    return row_results


def complete_inspection(inspection_id: int, db: Session):
    inspection = db.query(Inspection).filter(
        Inspection.inspection_id == inspection_id
    ).first()
    if not inspection:
        raise ValueError("Inspection not found")

    errors = db.query(Error).filter(
        Error.inspection_id == inspection_id
    ).all()

    failed_slots = []
    for error in errors:
        failed_slots.append({
            "slot_id": error.slotId,
            "status": "FAIL",
            "scanned_identification": error.extracted_id,
            "scanned_calibre": error.extracted_amp or "MISSING",
            "message": f"ID: expected '{error.expected_id}' got '{error.extracted_id}' | Calibre: expected '{error.expected_amp}' got '{error.extracted_amp}'"
        })

    verdict = "VALID" if len(failed_slots) == 0 else "INVALID"

    # panel_image_path = os.path.join(
    #     settings.UPLOAD_DIR, "panels",
    #     "cc.jpg"
    # )

    panel_image_path = os.path.join(
        settings.UPLOAD_DIR, "panels",
        f"inspection_{inspection_id}_panel.jpg"
    )

    with open(panel_image_path, "rb") as img_file:
        encoded = base64.b64encode(img_file.read()).decode("utf-8")

    return {
        "inspection_id": inspection_id,
        "verdict": verdict,
        "panel_image": encoded,
        "failed_slots": failed_slots
    }


def get_all_inspections(db: Session):
    results = (
        db.query(
            Inspection.inspection_id,
            Inspection.done_at,
            Inspection.ref_id,
            User.nom.label("operator_name"),
            Project.projectName.label("project_name")
        )
        .join(User, Inspection.done_by == User.user_id)
        .join(Reference, Inspection.ref_id == Reference.ref_id)
        .join(Project, Reference.project_id == Project.project_id)
        .all()
    )

    inspections = []
    for r in results:
        # Count errors for this inspection
        error_count = db.query(Error).filter(
            Error.inspection_id == r.inspection_id
        ).count()

        verdict = "VALID" if error_count == 0 else "INVALID"

        inspections.append({
            "inspection_id": r.inspection_id,
            "project_name": r.project_name,
            "reference_id": r.ref_id,
            "operator_name": r.operator_name,
            "done_at": r.done_at,
            "verdict": verdict,
            "total_errors": error_count
        })

    return inspections