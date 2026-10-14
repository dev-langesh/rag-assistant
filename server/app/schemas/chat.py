import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

MAX_QUERY_LENGTH = 1000


class ChatMessageContext(BaseModel):
    role: str = Field(..., description="Role of the sender: 'user' or 'assistant'")
    content: str = Field(..., description="Message text content")


class ChatRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        max_length=MAX_QUERY_LENGTH,
        description=f"User search query or question (1-{MAX_QUERY_LENGTH} characters)",
    )
    top_k: int = Field(default=4, ge=1, le=10, description="Number of top passages to use as context after re-ranking")
    context: List[ChatMessageContext] = Field(
        default_factory=list,
        description="Previous conversation history (user questions and agent responses)",
    )

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Query cannot be empty or whitespace only.")
        if len(trimmed) > MAX_QUERY_LENGTH:
            raise ValueError(f"Query must not exceed {MAX_QUERY_LENGTH} characters.")
        return trimmed


class CitationItem(BaseModel):
    id: str
    document_id: str
    filename: str
    content: str
    score: float
    initial_rrf_score: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
