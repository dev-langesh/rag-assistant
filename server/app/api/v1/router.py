from fastapi import APIRouter
from app.api.v1.endpoints import documents

api_router = APIRouter()

# Mount document ingestion endpoints under /documents
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
