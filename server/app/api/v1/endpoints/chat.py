import json
import logging
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from init_db import get_db
from app.schemas.chat import ChatRequest, CitationItem
from app.services.reranking import retrieve_and_rerank
from app.services.llm import stream_rag_response, generate_rag_response

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/stream",
    summary="Stream RAG Chat Response via Server-Sent Events (SSE)",
    description=(
        "Streams grounded answers using SSE (text/event-stream). "
        "Delivers dual-event payloads: 'event: citations' with JSON source metadata "
        "followed by 'event: message' with real-time response tokens."
    ),
    response_class=StreamingResponse,
)
async def chat_stream(
    request: ChatRequest,
    session: AsyncSession = Depends(get_db),
):
    async def sse_event_generator() -> AsyncGenerator[str, None]:
        try:
            # 1. Two-Stage Retrieval: Hybrid RRF in PostgreSQL -> FlashRank Cross-Encoder
            reranked_chunks = await retrieve_and_rerank(
                query=request.query,
                final_top_k=request.top_k,
                session=session,
            )

            # Format source citations metadata payload
            citations_payload = [
                {
                    "id": str(r.id),
                    "document_id": str(r.document_id),
                    "filename": r.filename,
                    "content": r.content,
                    "score": round(r.rerank_score, 4),
                    "initial_rrf_score": round(r.initial_rrf_score, 5),
                    "metadata": r.metadata,
                }
                for r in reranked_chunks
            ]

            # 2. Emit citations / sources metadata event
            citations_json = json.dumps(citations_payload)
            yield f"event: citations\ndata: {citations_json}\n\n"

            # 3. Stream grounded tokens incrementally from Gemini
            async for token in stream_rag_response(
                query=request.query,
                chunks=reranked_chunks,
            ):
                payload = json.dumps({"token": token, "text": token})
                yield f"event: message\ndata: {payload}\n\n"

            # 4. Emit terminal completion event
            yield f"event: done\ndata: {json.dumps({'status': 'completed'})}\n\n"

        except Exception as exc:
            logger.error(f"Error during SSE generation: {exc}", exc_info=True)
            yield f"event: error\ndata: {json.dumps({'error': str(exc)})}\n\n"
            yield f"event: done\ndata: {json.dumps({'status': 'error'})}\n\n"

    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers=headers,
    )


@router.post(
    "",
    summary="Synchronous RAG Chat Response",
    description="Returns the full grounded response and citations in a standard JSON response.",
)
async def chat_sync(
    request: ChatRequest,
    session: AsyncSession = Depends(get_db),
):
    # 1. Two-Stage Retrieval
    reranked_chunks = await retrieve_and_rerank(
        query=request.query,
        final_top_k=request.top_k,
        session=session,
    )

    # 2. Full Grounded Generation
    answer = await generate_rag_response(
        query=request.query,
        chunks=reranked_chunks,
    )

    citations = [
        CitationItem(
            id=str(r.id),
            document_id=str(r.document_id),
            filename=r.filename,
            content=r.content,
            score=round(r.rerank_score, 4),
            initial_rrf_score=round(r.initial_rrf_score, 5),
            metadata=r.metadata,
        )
        for r in reranked_chunks
    ]

    return {
        "query": request.query,
        "answer": answer,
        "citations": citations,
    }
