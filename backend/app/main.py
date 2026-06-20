from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import cases
from app.routers import documents
from app.routers import ai
from app.routers import dashboard
from app.routers import petitions
from app.routers import settings


app = FastAPI(title="AscendAI Case Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files statically
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(dashboard.router)
app.include_router(cases.router)
app.include_router(documents.router)
app.include_router(ai.router)
app.include_router(petitions.router)
app.include_router(settings.router)


@app.get("/")
def root():
    return {"message": "AscendAI Case Copilot Running"}