from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, projects, references, inspections, users, admin_dashboard



app = FastAPI(title="Vision Inspector API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include router for projects
app.include_router(projects.router)

# include router for inspections
app.include_router(inspections.router)

# include router for auth
app.include_router(auth.router)

# include router for references
app.include_router(references.router)

# include router for admin
app.include_router(users.router)

# include router for admin dashboard
app.include_router(admin_dashboard.router)

@app.get("/")
def root():
    return {"message": "Vision Inspector API is running"}