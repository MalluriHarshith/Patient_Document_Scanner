from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from datetime import datetime
from typing import Optional
import os

from app.services.storage_service import StorageService
from app.services.ocr_service import OCRService
from app.database import db_manager
from app.models.schemas import DocumentResponse, ExtractedMedicalRecord

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=dict)
async def upload_document(
    file: UploadFile = File(...),
    mobile_number: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    # 1. Save original document to file storage
    saved_info = await StorageService.save_file(file)

    # 2. Extract medical information using Multimodal AI OCR / Parser
    extracted_record = await OCRService.extract_medical_info(
        file_bytes=saved_info["raw_bytes"],
        filename=saved_info["original_filename"],
        mime_type=saved_info["mime_type"]
    )

    # Resolve Patient Name & Mobile Number from OCR or Form
    clean_name = extracted_record.patient_name if (extracted_record.patient_name and extracted_record.patient_name != "N/A") else (patient_name or "Ananya Reddy")
    clean_mobile = mobile_number or "9876543210"

    # 3. Create document record for MongoDB Atlas
    now_iso = datetime.now().isoformat()
    doc_payload = {
        "id": saved_info["file_id"],
        "patient_name": clean_name,
        "mobile_number": clean_mobile,
        "filename": saved_info["original_filename"],
        "saved_filename": saved_info["saved_filename"],
        "doc_type": extracted_record.doc_type,
        "file_path": saved_info["file_path"],
        "file_url": saved_info["file_url"],
        "mime_type": saved_info["mime_type"],
        "file_size": saved_info["file_size"],
        "checksum": saved_info["checksum"],
        "upload_date": now_iso,
        "summary": extracted_record.summary,
        "extracted_data": extracted_record.model_dump()
    }

    # 4. Store document record & link sub-records in MongoDB Atlas
    await db_manager.insert_document(doc_payload)
    await db_manager.save_extracted_records(
        doc_id=saved_info["file_id"],
        filename=saved_info["original_filename"],
        extracted=extracted_record.model_dump(),
        mobile_number=clean_mobile,
        patient_name=clean_name
    )

    return {
        "message": f"Medical document linked to patient '{clean_name}' saved to MongoDB Atlas successfully.",
        "document": doc_payload
    }

@router.get("", response_model=list)
async def get_all_documents(mobile_number: Optional[str] = None):
    docs = await db_manager.get_all_documents(mobile_number=mobile_number)
    return docs

@router.get("/{doc_id}")
async def get_document(doc_id: str):
    doc = await db_manager.get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    success = await db_manager.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or could not be deleted")
    return {"message": "Document and all associated details deleted across all MongoDB Atlas tables."}

@router.delete("/purge/{mobile_number}")
async def purge_all_for_mobile(mobile_number: str):
    success = await db_manager.delete_all_for_mobile(mobile_number)
    return {"message": f"All medical records for mobile {mobile_number} purged from MongoDB Atlas."}

@router.get("/download/{saved_filename}")
@router.get("/files/{saved_filename}")
async def download_file(saved_filename: str):
    file_path = StorageService.get_file_path(saved_filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=file_path, filename=saved_filename)
