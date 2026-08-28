from fastapi import APIRouter, HTTPException
from app.database import db_manager
from typing import List, Optional

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])

@router.get("", response_model=List[dict])
async def get_reminders(mobile_number: Optional[str] = None):
    reminders = await db_manager.get_all_reminders(mobile_number=mobile_number)
    return reminders

@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: str):
    success = await db_manager.delete_reminder(reminder_id)
    if not success:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"message": "Medicine reminder permanently deleted from MongoDB Atlas."}
