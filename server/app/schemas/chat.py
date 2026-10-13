import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatMessageContext(BaseModel):
    role: str = Field(..., description="Role of the sender: 'user' or 'assistant'")
    content: str = Field(..., description="Message text content")


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User search query or question")
    top_k: int = Field(default=4, ge=1, le=10, description="Number of top passages to use as context after re-ranking")
    context: List[ChatMessageContext] = Field(
        default_factory=list,
        description="Previous conversation history (user questions and agent responses)",
    )


class CitationItem(BaseModel):
    id: str
    document_id: str
    filename: str
    content: str
    score: float
    initial_rrf_score: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
