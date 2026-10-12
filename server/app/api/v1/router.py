from fastapi import APIRouter
from app.api.v1.endpoints import documents, chat

api_router = APIRouter()

# Mount document ingestion endpoints under /documents
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])

# Mount RAG chat and SSE streaming endpoints under /chat
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
