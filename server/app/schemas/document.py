import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class DocumentItem(BaseModel):
    id: uuid.UUID
    filename: str
    file_type: str
    created_at: datetime
    chunk_count: int

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    documents: List[DocumentItem]
    total: int


class DocumentUploadResponse(BaseModel):
    status: str
    document_id: uuid.UUID
    filename: str
    file_type: str
    chunks_created: int
    message: str
