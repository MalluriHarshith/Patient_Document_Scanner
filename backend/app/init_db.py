import asyncio
import logging
from app.config import settings
from app.database import db_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_mongodb_atlas():
    logger.info("Connecting to MongoDB Atlas to initialize 'patients' and 'doctors' collections...")
    await db_manager.connect()

    if not db_manager.is_atlas_connected:
        logger.error("Could not connect to MongoDB Atlas. Check URI and network connection.")
        return

    # Seed Patient Record into MongoDB Atlas
    patient_doc = await db_manager.upsert_patient(
        mobile_number="9876543210",
        name="Demo Smartphone Patient",
        extra_data={
            "age": 34,
            "gender": "Male",
            "blood_group": "O+",
            "emergency_contact": "+91 98765 00000",
            "known_allergies": ["Penicillin"]
        }
    )
    logger.info(f"Initialized Patient record in MongoDB Atlas: {patient_doc['mobile_number']}")

    # Seed Doctor Record into MongoDB Atlas
    doctor_doc = await db_manager.upsert_doctor(
        doctor_info={
            "doctor_name": "Dr. K. S. Sharma, MD",
            "clinic_name": "Apollo Healthcare Center",
            "specialty": "Internal Medicine"
        },
        patient_mobile="9876543210"
    )
    logger.info(f"Initialized Doctor record in MongoDB Atlas: {doctor_doc['doctor_name']}")

    # List collections in MongoDB Atlas
    collections = await db_manager.db.list_collection_names()
    logger.info(f"LIVE MONGODB ATLAS COLLECTIONS IN '{settings.DATABASE_NAME}': {collections}")

    await db_manager.disconnect()

if __name__ == "__main__":
    asyncio.run(seed_mongodb_atlas())
