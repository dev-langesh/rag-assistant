import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from init_db import AsyncSessionLocal
from app.services.embedding import generate_query_embedding


@dataclass
class SearchResult:
    id: uuid.UUID
    document_id: uuid.UUID
    filename: str
    content: str
    metadata: Dict[str, Any]
    rank_dense: Optional[int]
    rank_sparse: Optional[int]
    rrf_score: float


HYBRID_RRF_QUERY = text("""
WITH dense_search AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY embedding <=> CAST(:query_vector AS vector)) AS rank_dense
    FROM chunks
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> CAST(:query_vector AS vector)
    LIMIT :match_count
),
sparse_search AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY ts_rank_cd(tsv, plainto_tsquery('english', :query_text)) DESC) AS rank_sparse
    FROM chunks
    WHERE tsv @@ plainto_tsquery('english', :query_text)
    ORDER BY ts_rank_cd(tsv, plainto_tsquery('english', :query_text)) DESC
    LIMIT :match_count
)
SELECT 
    c.id,
    c.document_id,
    c.content,
    c.metadata,
    d.filename,
    d_s.rank_dense,
    s_s.rank_sparse,
    (
        COALESCE(1.0 / (:k + d_s.rank_dense), 0.0) +
        COALESCE(1.0 / (:k + s_s.rank_sparse), 0.0)
    ) AS rrf_score
FROM chunks c
JOIN documents d ON c.document_id = d.id
LEFT JOIN dense_search d_s ON c.id = d_s.id
LEFT JOIN sparse_search s_s ON c.id = s_s.id
WHERE d_s.id IS NOT NULL OR s_s.id IS NOT NULL
ORDER BY rrf_score DESC
LIMIT :limit;
""")


async def hybrid_search(
    query: str,
    limit: int = 5,
    k: int = 60,
    match_count: int = 20,
    session: Optional[AsyncSession] = None,
) -> List[SearchResult]:
    """
    Executes hybrid search combining dense semantic embeddings and sparse full-text search
    in parallel using PostgreSQL CTEs and window functions (ROW_NUMBER()).
    Results are merged using Reciprocal Rank Fusion (RRF):
    RRF_Score = 1 / (k + rank_dense) + 1 / (k + rank_sparse)
    """
    cleaned_query = query.strip()
    if not cleaned_query:
        return []

    # 1. Generate query embedding vector (768 dimensions)
    query_vector = generate_query_embedding(cleaned_query)

    async def _execute_search(s: AsyncSession) -> List[SearchResult]:
        result = await s.execute(
            HYBRID_RRF_QUERY,
            {
                "query_vector": str(query_vector),
                "query_text": cleaned_query,
                "match_count": match_count,
                "k": k,
                "limit": limit,
            },
        )
        rows = result.fetchall()
        return [
            SearchResult(
                id=row.id,
                document_id=row.document_id,
                filename=row.filename,
                content=row.content,
                metadata=row.metadata or {},
                rank_dense=row.rank_dense,
                rank_sparse=row.rank_sparse,
                rrf_score=float(row.rrf_score),
            )
            for row in rows
        ]

    if session is not None:
        return await _execute_search(session)
    else:
        async with AsyncSessionLocal() as s:
            return await _execute_search(s)
