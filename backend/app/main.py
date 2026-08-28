from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path

from app.config import settings
from app.database import db_manager
from app.routes import documents, history, chat, reminders, profiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB Atlas & Pre-warm EasyOCR model in RAM
    await db_manager.connect()
    try:
        from app.services.ocr_service import get_easyocr_reader
        get_easyocr_reader()
    except Exception as e:
        pass
    yield
    # Shutdown: Close database connections
    await db_manager.disconnect()

app = FastAPI(
    title="AI Healthcare Assistant API",
    description="Backend API for Document Upload OCR, MongoDB Atlas Storage, RAG Medical Search & Timeline",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static directory
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Register Routers
app.include_router(documents.router)
app.include_router(history.router)
app.include_router(chat.router)
app.include_router(reminders.router)
app.include_router(profiles.router)

# Health & API status endpoint
@app.get("/api")
@app.get("/api/")
async def api_root():
    return {
        "status": "online",
        "app": "AI Healthcare Assistant API",
        "mongodb_atlas": "Connected" if db_manager.is_atlas_connected else "Local Backup Mode",
        "database": settings.DATABASE_NAME,
        "cluster": "HealthcareCluster"
    }

# Check for built frontend dist directory (for single-service deployment)
frontend_dist_1 = settings.BASE_DIR.parent / "frontend" / "dist"
frontend_dist_2 = settings.BASE_DIR / "dist"
frontend_dist = frontend_dist_1 if frontend_dist_1.exists() else frontend_dist_2

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
    
    @app.get("/")
    async def serve_index():
        return FileResponse(frontend_dist / "index.html")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    async def root():
        return {
            "status": "online",
            "app": "AI Healthcare Assistant API",
            "mongodb_atlas": "Connected" if db_manager.is_atlas_connected else "Local Backup Mode",
            "database": settings.DATABASE_NAME,
            "cluster": "HealthcareCluster",
            "frontend_build": "Frontend static build not found. Running API-only mode."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
