from pydantic import BaseModel

class ProjectCreate(BaseModel):
    projectName: str

class ProjectUpdate(BaseModel):
    projectName: str

class ProjectResponse(BaseModel):
    project_id: int
    projectName: str

    class Config:
        from_attributes = True