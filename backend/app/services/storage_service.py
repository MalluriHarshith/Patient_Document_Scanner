import os
import hashlib
import uuid
from pathlib import Path
from fastapi import UploadFile
from app.config import settings

class StorageService:
    @staticmethod
    async def save_file(file: UploadFile) -> dict:
        filename = file.filename or "uploaded_doc.png"
        file_ext = Path(filename).suffix.lower() or ".png"
        file_id = str(uuid.uuid4())
        saved_filename = f"{file_id}_{filename}"
        file_path = settings.UPLOAD_DIR / saved_filename

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Calculate checksum
        checksum = hashlib.sha256(content).hexdigest()

        # Deduce document MIME type
        mime_type = file.content_type or "application/octet-stream"

        return {
            "file_id": file_id,
            "original_filename": filename,
            "saved_filename": saved_filename,
            "file_path": str(file_path),
            "file_url": f"/api/documents/files/{saved_filename}",
            "file_size": len(content),
            "mime_type": mime_type,
            "checksum": checksum,
            "raw_bytes": content
        }

    @staticmethod
    def get_file_path(saved_filename: str) -> Path:
        return settings.UPLOAD_DIR / saved_filename
