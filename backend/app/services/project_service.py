from sqlalchemy.orm import Session
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate

def get_all_projects(db: Session):
    return db.query(Project).all()

def get_project_by_id(project_id: int, db: Session):
    return db.query(Project).filter(Project.project_id == project_id).first()

def create_project(data: ProjectCreate, db: Session):
    existing = db.query(Project).filter(Project.projectName == data.projectName).first()
    if existing:
        return None
    project = Project(projectName=data.projectName)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

def update_project(project_id: int, data: ProjectUpdate, db: Session):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        return None
    project.projectName = data.projectName
    db.commit()
    db.refresh(project)
    return project

def delete_project(project_id: int, db: Session):
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        return None
    db.delete(project)
    db.commit()
    return True