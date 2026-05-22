from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.dependencies import require_admin

from app.models.inspection import Inspection
from app.models.user import User
from app.models.reference import Reference
from app.models.error import Error

router = APIRouter(
    prefix="/api/admin/dashboard",
    tags=["Admin Dashboard"]
)

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):

    inspections = db.query(Inspection).all()
    # -----------------------------
    # TOTAL INSPECTIONS
    # -----------------------------
    total_inspections = len(inspections)

    # -----------------------------
    # VALID INSPECTIONS
    # -----------------------------
    valid_inspections = []
    for i in inspections:
        error_count = db.query(Error).filter(
            Error.inspection_id == i.inspection_id
        ).count()

        if error_count == 0:
            valid_inspections.append(i)

    total_valid_inspections = len(valid_inspections)



    pass_rate = 0

    if total_inspections > 0:
        pass_rate = round(
            (total_valid_inspections / total_inspections) * 100,
            1
        )

    # -----------------------------
    # ACTIVE OPERATORS
    # -----------------------------
    active_operators = (
        db.query(User)
        .filter(
            User.role == "Controller",
            User.state == "active"
        )
        .count()
    )

    # -----------------------------
    # CRITICAL ERRORS
    # Example:
    # inspections having >= 5 errors
    # -----------------------------
    critical_errors =[]
    for i in inspections:
        error_count = db.query(Error).filter(
            Error.inspection_id == i.inspection_id
        ).count()

        if error_count >= 5:
            critical_errors.append(i)


    # -----------------------------
    # REFERENCES COUNT
    # -----------------------------
    total_references = db.query(Reference).count()

    # -----------------------------
    # TOTAL USERS
    # -----------------------------
    total_users = db.query(User).count()

    return {
        "total_inspections": total_inspections,
        "pass_rate": pass_rate,
        "active_operators": active_operators,
        "critical_errors": critical_errors,
        "total_references": total_references,
        "total_users": total_users
    }