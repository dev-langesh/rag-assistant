from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from flashrank import Ranker, RerankRequest
from app.services.retrieval import SearchResult

# Default lightweight cross-encoder ONNX model (runs in ~10-20ms on CPU)
DEFAULT_RERANK_MODEL = "ms-marco-TinyBERT-L-2-v2"

_ranker: Optional[Ranker] = None


def get_ranker(model_name: str = DEFAULT_RERANK_MODEL) -> Ranker:
    # Returns a singleton instance of the FlashRank Ranker.
    global _ranker
    if _ranker is None:
        _ranker = Ranker(model_name=model_name)
    return _ranker


@dataclass
class RerankedResult:
    id: Any
    document_id: Any
    filename: str
    content: str
    metadata: Dict[str, Any]
    initial_rrf_score: float
    rerank_score: float
    initial_rank: int


def rerank_results(
    query: str,
    candidates: List[SearchResult],
    top_k: int = 4,
    model_name: str = DEFAULT_RERANK_MODEL,
) -> List[RerankedResult]:
   
    # Stage 2 Re-Ranking:
    # Evaluates candidate passages using a cross-encoder (joint self-attention over query + document)
    # and trims candidates down to the top-k highest-fidelity passages.
    
    if not candidates:
        return []

    ranker = get_ranker(model_name=model_name)

    passages = [
        {
            "id": str(candidate.id),
            "text": candidate.content,
            "meta": {
                "document_id": str(candidate.document_id),
                "filename": candidate.filename,
                "metadata": candidate.metadata,
                "initial_rrf_score": candidate.rrf_score,
                "initial_rank": idx + 1,
            },
        }
        for idx, candidate in enumerate(candidates)
    ]

    rerank_request = RerankRequest(query=query, passages=passages)
    ranked_passages = ranker.rerank(rerank_request)

    results: List[RerankedResult] = []
    for p in ranked_passages[:top_k]:
        meta = p.get("meta", {})
        results.append(
            RerankedResult(
                id=p["id"],
                document_id=meta.get("document_id"),
                filename=meta.get("filename", ""),
                content=p["text"],
                metadata=meta.get("metadata", {}),
                initial_rrf_score=meta.get("initial_rrf_score", 0.0),
                rerank_score=float(p["score"]),
                initial_rank=meta.get("initial_rank", 0),
            )
        )

    return results


async def retrieve_and_rerank(
    query: str,
    stage1_limit: int = 20,
    final_top_k: int = 4,
    k: int = 60,
    model_name: str = DEFAULT_RERANK_MODEL,
    session: Optional[Any] = None,
) -> List[RerankedResult]:
    
    # Two-Stage Hybrid Search & Re-Ranking Pipeline:
    # - Stage 1: Hybrid RRF retrieval (dense + sparse CTE in PostgreSQL) retrieves top candidates.
    # - Stage 2: Cross-encoder re-ranking (FlashRank) scores and trims down to the top passages.
   
    from app.services.retrieval import hybrid_search

    # Stage 1: Hybrid Retrieval
    candidates = await hybrid_search(query=query, limit=stage1_limit, k=k, session=session)

    # Stage 2: Cross-Encoder Re-Ranking
    return rerank_results(query=query, candidates=candidates, top_k=final_top_k, model_name=model_name)
