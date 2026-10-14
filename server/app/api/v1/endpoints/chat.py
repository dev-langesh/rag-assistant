import json
import logging
from typing import AsyncGenerator, List
from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from init_db import get_db
from models import ChatMessage
from app.schemas.chat import ChatRequest, CitationItem, ChatMessageResponse
from app.services.reranking import retrieve_and_rerank
from app.services.llm import stream_rag_response, generate_rag_response

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/history",
    summary="Get persistent chat conversation history",
    response_model=List[ChatMessageResponse],
)
async def get_chat_history(
    session: AsyncSession = Depends(get_db),
):
    stmt = select(ChatMessage).order_by(ChatMessage.created_at.asc())
    result = await session.execute(stmt)
    records = result.scalars().all()
    return [
        ChatMessageResponse(
            id=str(r.id),
            role=r.role,
            content=r.content,
            citations=r.citations or [],
            created_at=r.created_at,
        )
        for r in records
    ]


@router.delete(
    "/history",
    summary="Clear persistent chat conversation history",
)
async def clear_chat_history(
    session: AsyncSession = Depends(get_db),
):
    await session.execute(delete(ChatMessage))
    await session.commit()
    return {"status": "success", "message": "Chat history cleared successfully."}


@router.post(
    "/stream",
    summary="Stream RAG Chat Response via Server-Sent Events (SSE)",
    description=(
        "Streams grounded answers using SSE (text/event-stream). "
        "Delivers dual-event payloads: 'event: citations' with JSON source metadata "
        "followed by 'event: message' with real-time response tokens. "
        "Persists user questions and grounded responses into the database."
    ),
    response_class=StreamingResponse,
)
async def chat_stream(
    request: ChatRequest,
    session: AsyncSession = Depends(get_db),
):
    # 1. Persist the user question to the database
    user_msg = ChatMessage(
        role="user",
        content=request.query,
    )
    session.add(user_msg)
    await session.commit()

    async def sse_event_generator() -> AsyncGenerator[str, None]:
        accumulated_tokens: List[str] = []
        citations_payload: List[dict] = []

        try:
            # 2. Two-Stage Retrieval: Hybrid RRF in PostgreSQL -> FlashRank Cross-Encoder
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

            # 3. Emit citations / sources metadata event
            citations_json = json.dumps(citations_payload)
            yield f"event: citations\ndata: {citations_json}\n\n"

            # 4. Stream grounded tokens incrementally from Gemini with conversation context
            async for token in stream_rag_response(
                query=request.query,
                chunks=reranked_chunks,
                context=request.context,
            ):
                accumulated_tokens.append(token)
                payload = json.dumps({"token": token, "text": token})
                yield f"event: message\ndata: {payload}\n\n"

            # 5. Persist assistant response and citations to the database
            full_text = "".join(accumulated_tokens).strip()
            if full_text:
                asst_msg = ChatMessage(
                    role="assistant",
                    content=full_text,
                    citations=citations_payload,
                )
                session.add(asst_msg)
                await session.commit()

            # 6. Emit terminal completion event
            yield f"event: done\ndata: {json.dumps({'status': 'completed'})}\n\n"

        except Exception as exc:
            logger.error(f"Error during SSE generation: {exc}", exc_info=True)
            # If partial response was generated before error, persist it
            partial_text = "".join(accumulated_tokens).strip()
            if partial_text:
                try:
                    asst_msg = ChatMessage(
                        role="assistant",
                        content=partial_text,
                        citations=citations_payload,
                    )
                    session.add(asst_msg)
                    await session.commit()
                except Exception as db_exc:
                    logger.error(f"Failed to persist partial message: {db_exc}")

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
    # 1. Persist user query
    user_msg = ChatMessage(role="user", content=request.query)
    session.add(user_msg)
    await session.commit()

    # 2. Two-Stage Retrieval
    reranked_chunks = await retrieve_and_rerank(
        query=request.query,
        final_top_k=request.top_k,
        session=session,
    )

    # 3. Full Grounded Generation
    answer = await generate_rag_response(
        query=request.query,
        chunks=reranked_chunks,
        context=request.context,
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

    # 4. Persist assistant answer
    asst_msg = ChatMessage(
        role="assistant",
        content=answer,
        citations=[c.model_dump() for c in citations],
    )
    session.add(asst_msg)
    await session.commit()

    return {
        "query": request.query,
        "answer": answer,
        "citations": citations,
    }
