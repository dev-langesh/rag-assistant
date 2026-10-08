import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession

from init_db import AsyncSessionLocal
from models import Document, Chunk
from app.services.embedding import generate_embeddings


async def store_document(
    filename: str,
    file_type: str,
    chunks: List[str],
    metadatas: Optional[List[Dict[str, Any]]] = None,
    embeddings: Optional[List[List[float]]] = None,
    session: Optional[AsyncSession] = None,
) -> Document:
    # Stores a document and its chunks in PostgreSQL in a single atomic transaction.
    # Computes dense vector embeddings (FastEmbed) and PostgreSQL native tsvector
    # (to_tsvector('english', content)) for hybrid sparse-dense search.
    
    if not chunks:
        raise ValueError("Cannot store document with empty chunks")

    # Generate dense vector embeddings if not already provided
    if embeddings is None:
        embeddings = generate_embeddings(chunks)

    if metadatas is None:
        metadatas = [{} for _ in chunks]

    async def _execute_insert(s: AsyncSession) -> Document:
        doc = Document(
            id=uuid.uuid4(),
            filename=filename,
            file_type=file_type,
        )
        s.add(doc)
        await s.flush()

        chunk_records = []
        for content, meta, emb in zip(chunks, metadatas, embeddings):
            chunk = Chunk(
                id=uuid.uuid4(),
                document_id=doc.id,
                content=content,
                metadata_=meta,
                embedding=emb,
                tsv=func.to_tsvector("english", content),
            )
            chunk_records.append(chunk)

        s.add_all(chunk_records)
        await s.commit()
        await s.refresh(doc)
        return doc

    if session is not None:
        return await _execute_insert(session)
    else:
        async with AsyncSessionLocal() as s:
            return await _execute_insert(s)
