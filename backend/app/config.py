import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI",
        "mongodb+srv://m4upgraded124_db_user:<db_password>@healthcarecluster.k0nyyfn.mongodb.net/healthcare_db?appName=HealthcareCluster"
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "healthcare_db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads")

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
