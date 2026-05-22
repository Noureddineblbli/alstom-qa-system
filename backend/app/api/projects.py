from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import (
    get_all_projects,
    get_project_by_id,
    create_project,
    update_project,
    delete_project
)
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from typing import List

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("/", response_model=List[ProjectResponse])
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_all_projects(db)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = get_project_by_id(project_id, db)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

@router.post("/", response_model=ProjectResponse)
def create_new_project(data: ProjectCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    project = create_project(data, db)
    if not project:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project name already exists")
    return project
    
@router.put("/{project_id}", response_model=ProjectResponse)
def update_existing_project(project_id: int, data: ProjectUpdate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    project = update_project(project_id, data, db)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

@router.delete("/{project_id}")
def delete_existing_project(project_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    result = delete_project(project_id, db)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return {"message": "Project deleted successfully"}