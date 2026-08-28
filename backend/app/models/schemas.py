from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class PatientProfile(BaseModel):
    id: Optional[str] = None
    mobile_number: Optional[str] = None
    name: Optional[str] = "N/A"
    age: Optional[int] = None
    gender: Optional[str] = "N/A"
    blood_group: Optional[str] = "N/A"
    emergency_contact: Optional[str] = "N/A"
    known_allergies: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None

class DoctorProfile(BaseModel):
    id: Optional[str] = None
    doctor_name: str = "N/A"
    clinic_name: Optional[str] = "N/A"
    specialty: Optional[str] = "N/A"
    contact_number: Optional[str] = "N/A"
    location: Optional[str] = "N/A"
    associated_patient_mobiles: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None

class DoctorInfo(BaseModel):
    doctor_name: Optional[str] = "N/A"
    clinic_name: Optional[str] = "N/A"
    specialty: Optional[str] = "N/A"
    consultation_date: Optional[str] = "N/A"

class Medicine(BaseModel):
    name: str = "N/A"
    dosage: Optional[str] = "N/A"
    frequency: Optional[str] = "N/A"
    timing: Optional[str] = "N/A"
    duration: Optional[str] = "N/A"
    instructions: Optional[str] = "N/A"

class LabResult(BaseModel):
    test_name: str = "N/A"
    value: str = "N/A"
    unit: Optional[str] = "N/A"
    reference_range: Optional[str] = "N/A"
    status: Optional[str] = "N/A" # Normal, High, Low, Critical, N/A
    category: Optional[str] = "N/A"

class Diagnosis(BaseModel):
    condition_name: str = "N/A"
    type: Optional[str] = "N/A" # Acute, Chronic, Past, Observation, N/A
    severity: Optional[str] = "N/A"
    notes: Optional[str] = "N/A"

class DoctorInstruction(BaseModel):
    instruction: str = "N/A"
    category: Optional[str] = "N/A"

class FollowUpDate(BaseModel):
    date: str = "N/A"
    reason: Optional[str] = "N/A"
    doctor: Optional[str] = "N/A"

class ExtractedMedicalRecord(BaseModel):
    doc_type: str = "Prescription" # Prescription, Lab Report, Discharge Summary, Doctor Note, Radiology
    patient_name: Optional[str] = "N/A"
    title: str = "N/A"
    summary: str = "N/A"
    doctor_info: DoctorInfo = Field(default_factory=DoctorInfo)
    diagnoses: List[Diagnosis] = Field(default_factory=list)
    medicines: List[Medicine] = Field(default_factory=list)
    lab_results: List[LabResult] = Field(default_factory=list)
    doctor_instructions: List[DoctorInstruction] = Field(default_factory=list)
    follow_up_dates: List[FollowUpDate] = Field(default_factory=list)
    raw_extracted_text: str = "N/A"

class DocumentResponse(BaseModel):
    id: str
    patient_name: Optional[str] = None
    mobile_number: Optional[str] = None
    filename: str
    doc_type: str = "N/A"
    file_path: str
    upload_date: str
    extracted_data: ExtractedMedicalRecord
    summary: str = "N/A"

class ChatMessage(BaseModel):
    role: str # user, assistant
    content: str
    timestamp: Optional[str] = None

class RAGQueryRequest(BaseModel):
    query: str
    patient_name: Optional[str] = None
    mobile_number: Optional[str] = None
    language: str = "English" # English, Telugu, Hindi, Spanish, Tamil, etc.
    chat_history: List[ChatMessage] = Field(default_factory=list)

class SourceCitation(BaseModel):
    document_id: str
    filename: str
    doc_type: str = "N/A"
    upload_date: str
    relevant_snippet: str = "N/A"

class RAGQueryResponse(BaseModel):
    answer: str
    language: str
    patient_name: Optional[str] = None
    mobile_number: Optional[str] = None
    sources: List[SourceCitation] = Field(default_factory=list)
    non_diagnostic_disclaimer: str = (
        "Non-diagnostic notification: This AI assistant organizes and retrieves your official medical records. "
        "It does not diagnose conditions, prescribe medications, or alter doctor instructions. "
        "Always consult a qualified doctor for medical guidance."
    )

class ReminderItem(BaseModel):
    id: str
    patient_name: Optional[str] = None
    mobile_number: Optional[str] = None
    type: str # medicine, appointment
    title: str = "N/A"
    details: str = "N/A"
    timing_or_date: str = "N/A"
    source_doc_id: str
    source_filename: str
    status: str = "pending"
