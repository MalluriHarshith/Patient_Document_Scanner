from fastapi import APIRouter, HTTPException
from app.database import db_manager
from app.models.schemas import PatientProfile, DoctorProfile
from typing import List, Optional

router = APIRouter(prefix="/api/profiles", tags=["Patient & Doctor Profiles"])

@router.get("/patient/{mobile_number}")
async def get_patient_profile(mobile_number: str):
    patient = await db_manager.get_patient_by_mobile(mobile_number)
    if not patient:
        return {
            "mobile_number": mobile_number,
            "name": "Patient",
            "gender": "Unspecified",
            "note": "Default profile initialized"
        }
    return patient

@router.post("/patient")
async def update_patient_profile(profile: PatientProfile):
    if not profile.mobile_number:
        raise HTTPException(status_code=400, detail="Mobile number is required")
    
    doc = await db_manager.upsert_patient(
        mobile_number=profile.mobile_number,
        name=profile.name,
        extra_data=profile.model_dump(exclude_none=True)
    )
    return {"message": "Patient profile saved to MongoDB Atlas.", "patient": doc}

@router.get("/doctors", response_model=List[dict])
async def get_doctors():
    doctors = await db_manager.get_all_doctors()
    return doctors
