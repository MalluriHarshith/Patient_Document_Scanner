from fastapi import APIRouter, HTTPException
from app.models.schemas import RAGQueryRequest, RAGQueryResponse
from app.services.rag_service import RAGService

router = APIRouter(prefix="/api/chat", tags=["AI Chat Assistant"])

@router.post("", response_model=RAGQueryResponse)
async def chat_with_assistant(request: RAGQueryRequest):
    if not request.query:
        raise HTTPException(status_code=400, detail="Query text cannot be empty")
    
    response = await RAGService.process_user_query(request)
    return response
