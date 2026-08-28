from fastapi import APIRouter
from app.database import db_manager
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/history", tags=["Medical History"])

@router.get("/timeline")
async def get_medical_timeline(mobile_number: Optional[str] = None):
    docs = await db_manager.get_all_documents(mobile_number=mobile_number)
    
    # Sort docs chronologically by upload_date
    sorted_docs = sorted(docs, key=lambda x: x.get("upload_date", ""), reverse=True)
    
    timeline_items = []
    for d in sorted_docs:
        ext = d.get("extracted_data", {})
        doctor_info = ext.get("doctor_info", {})
        
        timeline_items.append({
            "id": d.get("id"),
            "mobile_number": d.get("mobile_number", "9876543210"),
            "filename": d.get("filename"),
            "doc_type": d.get("doc_type", "Prescription"),
            "upload_date": d.get("upload_date"),
            "consultation_date": doctor_info.get("consultation_date") or d.get("upload_date"),
            "summary": d.get("summary", ""),
            "doctor_name": doctor_info.get("doctor_name", "Doctor"),
            "clinic_name": doctor_info.get("clinic_name", "Clinic"),
            "diagnoses_count": len(ext.get("diagnoses", [])),
            "medicines_count": len(ext.get("medicines", [])),
            "lab_tests_count": len(ext.get("lab_results", [])),
            "file_url": d.get("file_url")
        })
        
    return timeline_items

@router.get("/lab-trends")
async def get_lab_trends(mobile_number: Optional[str] = None):
    lab_results = await db_manager.get_all_lab_results(mobile_number=mobile_number)
    
    # Group results by test parameter name (e.g., HbA1c, Fasting Blood Glucose)
    grouped: Dict[str, List[dict]] = {}
    for lr in lab_results:
        test_name = lr.get("test_name", "Unknown Test")
        if test_name not in grouped:
            grouped[test_name] = []
        grouped[test_name].append({
            "id": lr.get("id"),
            "mobile_number": lr.get("mobile_number", "9876543210"),
            "date": lr.get("created_at", "")[:10],
            "value": lr.get("value"),
            "unit": lr.get("unit", ""),
            "status": lr.get("status", "Normal"),
            "filename": lr.get("filename", "")
        })
        
    return grouped
