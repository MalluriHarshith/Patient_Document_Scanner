import logging
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

# Try importing Motor / PyMongo / BSON
MONGODB_AVAILABLE = False
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    from pymongo import MongoClient
    from bson import ObjectId
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False

def to_object_id(val: str):
    if not val:
        return val
    try:
        from bson import ObjectId
        if ObjectId.is_valid(val):
            return ObjectId(val)
    except Exception:
        pass
    return val

class LocalStoreFallback:
    """In-memory & file mirror fallback when MongoDB Atlas credentials are not yet configured or unreachable."""
    def __init__(self):
        self.documents: Dict[str, dict] = {}
        self.medical_records: Dict[str, dict] = {}
        self.medicines: Dict[str, dict] = {}
        self.lab_results: Dict[str, dict] = {}
        self.reminders: Dict[str, dict] = {}
        self.patients: Dict[str, dict] = {}
        self.doctors: Dict[str, dict] = {}

    async def insert_document(self, doc_data: dict) -> str:
        doc_id = doc_data.get("id") or str(uuid.uuid4())
        doc_data["id"] = doc_id
        doc_data["_id"] = doc_id
        self.documents[doc_id] = doc_data
        return doc_id

    async def get_documents(self, mobile_number: Optional[str] = None) -> List[dict]:
        docs = list(self.documents.values())
        if mobile_number:
            return [d for d in docs if d.get("mobile_number") == mobile_number or not d.get("mobile_number")]
        return docs

    async def get_document_by_id(self, doc_id: str) -> Optional[dict]:
        return self.documents.get(doc_id)

    async def delete_document(self, doc_id: str) -> bool:
        if doc_id in self.documents:
            del self.documents[doc_id]
            # delete linked records across all tables
            self.medical_records = {k: v for k, v in self.medical_records.items() if v.get("doc_id") != doc_id}
            self.medicines = {k: v for k, v in self.medicines.items() if v.get("doc_id") != doc_id}
            self.lab_results = {k: v for k, v in self.lab_results.items() if v.get("doc_id") != doc_id}
            self.reminders = {k: v for k, v in self.reminders.items() if v.get("source_doc_id") != doc_id and v.get("doc_id") != doc_id}
            if len(self.documents) == 0:
                self.patients.clear()
                self.doctors.clear()
            return True
        return False

    async def delete_reminder(self, reminder_id: str) -> bool:
        self.reminders.pop(reminder_id, None)
        self.medicines.pop(reminder_id, None)
        return True

    async def delete_all_for_mobile(self, mobile_number: str) -> bool:
        self.documents = {k: v for k, v in self.documents.items() if v.get("mobile_number") != mobile_number}
        self.medical_records = {k: v for k, v in self.medical_records.items() if v.get("mobile_number") != mobile_number}
        self.medicines = {k: v for k, v in self.medicines.items() if v.get("mobile_number") != mobile_number}
        self.lab_results = {k: v for k, v in self.lab_results.items() if v.get("mobile_number") != mobile_number}
        self.reminders = {k: v for k, v in self.reminders.items() if v.get("mobile_number") != mobile_number}
        self.patients.pop(mobile_number, None)
        if len(self.documents) == 0:
            self.doctors.clear()
        return True

    async def get_medical_records(self) -> List[dict]:
        return list(self.medical_records.values())

fallback_db = LocalStoreFallback()

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_atlas_connected = False

    async def connect(self):
        uri = settings.MONGODB_URI
        # Check if URI contains placeholder <db_password>
        if "<db_password>" in uri or not settings.MONGODB_URI:
            logger.warning("MongoDB URI contains '<db_password>' placeholder or is empty. Using Local Backup Database Manager.")
            self.is_atlas_connected = False
            return

        try:
            self.client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=4000)
            # Test connection
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_atlas_connected = True
            logger.info(f"Successfully connected to MongoDB Atlas database: {settings.DATABASE_NAME}")
        except Exception as e:
            logger.error(f"Could not connect to MongoDB Atlas cluster: {e}. Falling back to local storage manager.")
            self.is_atlas_connected = False

    async def disconnect(self):
        if self.client:
            self.client.close()

    async def insert_document(self, doc_data: dict) -> str:
        doc_id = doc_data.get("id") or str(uuid.uuid4())
        doc_data["id"] = doc_id
        doc_data["_id"] = doc_id
        
        if self.is_atlas_connected and self.db is not None:
            try:
                await self.db.documents.insert_one(doc_data)
                return doc_id
            except Exception as e:
                logger.error(f"MongoDB Atlas insert error: {e}")
        
        return await fallback_db.insert_document(doc_data)

    async def get_all_documents(self, mobile_number: Optional[str] = None) -> List[dict]:
        if self.is_atlas_connected and self.db is not None:
            try:
                query = {}
                if mobile_number:
                    query = {"$or": [{"mobile_number": mobile_number}, {"mobile_number": {"$exists": False}}]}
                cursor = self.db.documents.find(query)
                docs = await cursor.to_list(length=500)
                for d in docs:
                    d["_id"] = str(d["_id"])
                return docs
            except Exception as e:
                logger.error(f"MongoDB Atlas query error: {e}")
        return await fallback_db.get_documents(mobile_number)

    async def get_document_by_id(self, doc_id: str) -> Optional[dict]:
        if self.is_atlas_connected and self.db is not None:
            try:
                doc = await self.db.documents.find_one({"$or": [{"id": doc_id}, {"_id": doc_id}, {"_id": to_object_id(doc_id)}]})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.error(f"MongoDB Atlas get error: {e}")
        return await fallback_db.get_document_by_id(doc_id)

    async def delete_document(self, doc_id: str) -> bool:
        """Deletes document and ALL linked entries across ALL 7 MongoDB Atlas collections."""
        doc = await self.get_document_by_id(doc_id)
        if self.is_atlas_connected and self.db is not None:
            try:
                obj_id = to_object_id(doc_id)
                # 1. Delete from 'documents' table
                await self.db.documents.delete_many({"$or": [{"id": doc_id}, {"_id": doc_id}, {"_id": obj_id}]})
                
                # 2. Delete from 'medicines' table
                await self.db.medicines.delete_many({"$or": [{"doc_id": doc_id}, {"id": doc_id}, {"_id": obj_id}]})
                
                # 3. Delete from 'lab_results' table
                await self.db.lab_results.delete_many({"$or": [{"doc_id": doc_id}, {"id": doc_id}, {"_id": obj_id}]})
                
                # 4. Delete from 'reminders' table
                await self.db.reminders.delete_many({"$or": [{"source_doc_id": doc_id}, {"doc_id": doc_id}, {"id": doc_id}, {"_id": obj_id}]})
                
                # 5. Delete from 'medical_records' table
                await self.db.medical_records.delete_many({"$or": [{"doc_id": doc_id}, {"id": doc_id}, {"_id": obj_id}]})

                # 6. Check if documents collection is empty: if empty, purge 'patients' and 'doctors' tables as well
                remaining_docs = await self.db.documents.count_documents({})
                if remaining_docs == 0:
                    await self.db.patients.delete_many({})
                    await self.db.doctors.delete_many({})

                # 7. Fallback in-memory delete
                await fallback_db.delete_document(doc_id)

                # 8. Delete physical file from uploads storage
                if doc and doc.get("saved_filename"):
                    from app.services.storage_service import StorageService
                    fp = StorageService.get_file_path(doc["saved_filename"])
                    if fp.exists():
                        try:
                            fp.unlink()
                        except Exception as fe:
                            logger.warning(f"Could not delete physical file {fp}: {fe}")

                return True
            except Exception as e:
                logger.error(f"MongoDB Atlas delete error: {e}")
        return await fallback_db.delete_document(doc_id)

    async def delete_reminder(self, reminder_id: str) -> bool:
        """Completely removes reminder and corresponding medicine item from MongoDB Atlas."""
        if self.is_atlas_connected and self.db is not None:
            try:
                obj_id = to_object_id(reminder_id)
                await self.db.reminders.delete_many({"$or": [{"id": reminder_id}, {"_id": reminder_id}, {"_id": obj_id}]})
                await self.db.medicines.delete_many({"$or": [{"id": reminder_id}, {"_id": reminder_id}, {"_id": obj_id}]})
                await fallback_db.delete_reminder(reminder_id)
                return True
            except Exception as e:
                logger.error(f"MongoDB Atlas reminder delete error: {e}")
        return await fallback_db.delete_reminder(reminder_id)

    async def delete_all_for_mobile(self, mobile_number: str) -> bool:
        """Purges ALL records for a mobile number across ALL 7 MongoDB Atlas collections/tables."""
        if self.is_atlas_connected and self.db is not None:
            try:
                await self.db.documents.delete_many({"mobile_number": mobile_number})
                await self.db.medicines.delete_many({"mobile_number": mobile_number})
                await self.db.lab_results.delete_many({"mobile_number": mobile_number})
                await self.db.reminders.delete_many({"mobile_number": mobile_number})
                await self.db.medical_records.delete_many({"mobile_number": mobile_number})
                await self.db.patients.delete_many({"mobile_number": mobile_number})
                
                remaining_docs = await self.db.documents.count_documents({})
                if remaining_docs == 0:
                    await self.db.doctors.delete_many({})

                await fallback_db.delete_all_for_mobile(mobile_number)
                return True
            except Exception as e:
                logger.error(f"MongoDB Atlas purge for mobile error: {e}")
        return await fallback_db.delete_all_for_mobile(mobile_number)

    async def upsert_patient(self, mobile_number: str, name: str = "Patient Name", extra_data: dict = None) -> dict:
        """Upsert patient profile in MongoDB Atlas 'patients' collection."""
        now = datetime.now().isoformat()
        patient_doc = {
            "mobile_number": mobile_number,
            "name": name if name else "Patient Name",
            "updated_at": now
        }
        if extra_data:
            patient_doc.update(extra_data)

        if self.is_atlas_connected and self.db is not None:
            try:
                await self.db.patients.update_one(
                    {"mobile_number": mobile_number},
                    {"$set": patient_doc, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now}},
                    upsert=True
                )
            except Exception as e:
                logger.error(f"MongoDB Atlas patient upsert error: {e}")

        fallback_db.patients[mobile_number] = patient_doc
        return patient_doc

    async def get_patient_by_mobile(self, mobile_number: str) -> Optional[dict]:
        if self.is_atlas_connected and self.db is not None:
            try:
                doc = await self.db.patients.find_one({"mobile_number": mobile_number})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.error(f"MongoDB Atlas patient fetch error: {e}")
        return fallback_db.patients.get(mobile_number)

    async def upsert_doctor(self, doctor_info: dict, patient_mobile: str = None) -> dict:
        """Upsert doctor profile in MongoDB Atlas 'doctors' collection."""
        now = datetime.now().isoformat()
        doc_name = doctor_info.get("doctor_name") or "N/A"
        clinic_name = doctor_info.get("clinic_name") or "N/A"

        doc_key = f"{doc_name}_{clinic_name}".lower().replace(" ", "_")

        doc_payload = {
            "id": doc_key,
            "doctor_name": doc_name,
            "clinic_name": clinic_name,
            "specialty": doctor_info.get("specialty") or "N/A",
            "updated_at": now
        }

        if self.is_atlas_connected and self.db is not None:
            try:
                update_op = {"$set": doc_payload, "$setOnInsert": {"created_at": now}}
                if patient_mobile:
                    update_op["$addToSet"] = {"associated_patient_mobiles": patient_mobile}

                await self.db.doctors.update_one(
                    {"id": doc_key},
                    update_op,
                    upsert=True
                )
            except Exception as e:
                logger.error(f"MongoDB Atlas doctor upsert error: {e}")

        fallback_db.doctors[doc_key] = doc_payload
        return doc_payload

    async def get_all_doctors(self) -> List[dict]:
        if self.is_atlas_connected and self.db is not None:
            try:
                cursor = self.db.doctors.find({})
                docs = await cursor.to_list(length=500)
                for d in docs:
                    d["_id"] = str(d["_id"])
                return docs
            except Exception as e:
                logger.error(f"MongoDB Atlas doctors fetch error: {e}")
        return list(fallback_db.doctors.values())

    async def save_extracted_records(
        self, 
        doc_id: str, 
        filename: str, 
        extracted: dict, 
        mobile_number: str = "9876543210",
        patient_name: str = "Patient Name"
    ):
        """Save linked sub-records for medicines, lab results, reminders, patients, and doctors."""
        now = datetime.now().isoformat()
        
        # 1. Upsert Patient Record with patient_name
        await self.upsert_patient(mobile_number=mobile_number, name=patient_name)

        # 2. Upsert Doctor Record
        doc_info = extracted.get("doctor_info", {})
        if doc_info.get("doctor_name") and doc_info.get("doctor_name") != "N/A":
            await self.upsert_doctor(doctor_info=doc_info, patient_mobile=mobile_number)

        # 3. Save medicines
        medicines = extracted.get("medicines", [])
        med_docs = []
        for m in medicines:
            m_id = str(uuid.uuid4())
            m_doc = {
                "id": m_id,
                "_id": m_id,
                "doc_id": doc_id,
                "patient_name": patient_name,
                "mobile_number": mobile_number,
                "filename": filename,
                "name": m.get("name") or "N/A",
                "dosage": m.get("dosage") or "N/A",
                "frequency": m.get("frequency") or "N/A",
                "timing": m.get("timing") or "N/A",
                "duration": m.get("duration") or "N/A",
                "instructions": m.get("instructions") or "N/A",
                "created_at": now
            }
            med_docs.append(m_doc)
            fallback_db.medicines[m_id] = m_doc

        if self.is_atlas_connected and self.db is not None and med_docs:
            try:
                await self.db.medicines.insert_many(med_docs)
            except Exception as e:
                logger.error(f"Failed to insert medicines to MongoDB Atlas: {e}")

        # 4. Save lab results
        lab_results = extracted.get("lab_results", [])
        lab_docs = []
        for lr in lab_results:
            l_id = str(uuid.uuid4())
            l_doc = {
                "id": l_id,
                "_id": l_id,
                "doc_id": doc_id,
                "patient_name": patient_name,
                "mobile_number": mobile_number,
                "filename": filename,
                "test_name": lr.get("test_name") or "N/A",
                "value": lr.get("value") or "N/A",
                "unit": lr.get("unit") or "N/A",
                "reference_range": lr.get("reference_range") or "N/A",
                "status": lr.get("status") or "N/A",
                "category": lr.get("category") or "N/A",
                "created_at": now
            }
            lab_docs.append(l_doc)
            fallback_db.lab_results[l_id] = l_doc

        if self.is_atlas_connected and self.db is not None and lab_docs:
            try:
                await self.db.lab_results.insert_many(lab_docs)
            except Exception as e:
                logger.error(f"Failed to insert lab_results to MongoDB Atlas: {e}")

        # 5. Save reminders
        follow_ups = extracted.get("follow_up_dates", [])
        rem_docs = []
        for m in medicines:
            rem_id = str(uuid.uuid4())
            rem_doc = {
                "id": rem_id,
                "_id": rem_id,
                "patient_name": patient_name,
                "mobile_number": mobile_number,
                "type": "medicine",
                "title": f"Take {m.get('name') or 'N/A'}",
                "details": f"Dosage: {m.get('dosage') or 'N/A'} ({m.get('timing') or 'N/A'}) - {m.get('frequency') or 'N/A'}",
                "timing_or_date": m.get("timing") or "N/A",
                "source_doc_id": doc_id,
                "source_filename": filename,
                "status": "pending",
                "created_at": now
            }
            rem_docs.append(rem_doc)
            fallback_db.reminders[rem_id] = rem_doc

        for fu in follow_ups:
            fu_id = str(uuid.uuid4())
            fu_doc = {
                "id": fu_id,
                "_id": fu_id,
                "patient_name": patient_name,
                "mobile_number": mobile_number,
                "type": "appointment",
                "title": f"Follow-up: {fu.get('reason') or 'Checkup'}",
                "details": f"Doctor: {fu.get('doctor') or doc_info.get('doctor_name') or 'N/A'}",
                "timing_or_date": fu.get("date") or "N/A",
                "source_doc_id": doc_id,
                "source_filename": filename,
                "status": "pending",
                "created_at": now
            }
            rem_docs.append(fu_doc)
            fallback_db.reminders[fu_id] = fu_doc

        if self.is_atlas_connected and self.db is not None and rem_docs:
            try:
                await self.db.reminders.insert_many(rem_docs)
            except Exception as e:
                logger.error(f"Failed to insert reminders to MongoDB Atlas: {e}")

    async def get_all_medicines(self, mobile_number: Optional[str] = None) -> List[dict]:
        if self.is_atlas_connected and self.db is not None:
            try:
                query = {}
                if mobile_number:
                    query = {"$or": [{"mobile_number": mobile_number}, {"mobile_number": {"$exists": False}}]}
                cursor = self.db.medicines.find(query)
                docs = await cursor.to_list(length=500)
                for d in docs:
                    d["_id"] = str(d["_id"])
                return docs
            except Exception as e:
                logger.error(f"MongoDB Atlas medicines error: {e}")
        all_meds = list(fallback_db.medicines.values())
        if mobile_number:
            return [m for m in all_meds if m.get("mobile_number") == mobile_number or not m.get("mobile_number")]
        return all_meds

    async def get_all_lab_results(self, mobile_number: Optional[str] = None) -> List[dict]:
        if self.is_atlas_connected and self.db is not None:
            try:
                query = {}
                if mobile_number:
                    query = {"$or": [{"mobile_number": mobile_number}, {"mobile_number": {"$exists": False}}]}
                cursor = self.db.lab_results.find(query)
                docs = await cursor.to_list(length=500)
                for d in docs:
                    d["_id"] = str(d["_id"])
                return docs
            except Exception as e:
                logger.error(f"MongoDB Atlas lab_results error: {e}")
        all_labs = list(fallback_db.lab_results.values())
        if mobile_number:
            return [l for l in all_labs if l.get("mobile_number") == mobile_number or not l.get("mobile_number")]
        return all_labs

    async def get_all_reminders(self, mobile_number: Optional[str] = None) -> List[dict]:
        if self.is_atlas_connected and self.db is not None:
            try:
                query = {}
                if mobile_number:
                    query = {"$or": [{"mobile_number": mobile_number}, {"mobile_number": {"$exists": False}}]}
                cursor = self.db.reminders.find(query)
                docs = await cursor.to_list(length=500)
                for d in docs:
                    d["_id"] = str(d["_id"])
                return docs
            except Exception as e:
                logger.error(f"MongoDB Atlas reminders error: {e}")
        all_rems = list(fallback_db.reminders.values())
        if mobile_number:
            return [r for r in all_rems if r.get("mobile_number") == mobile_number or not r.get("mobile_number")]
        return all_rems

db_manager = DatabaseManager()
