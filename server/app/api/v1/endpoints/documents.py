import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from init_db import get_db
from models import Document, Chunk
from app.services.ingestion import extract_text_from_file, chunk_text
from app.services.storage import store_document
from app.schemas.document import DocumentUploadResponse, DocumentListResponse, DocumentItem

router = APIRouter()

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown"}


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and ingest a document",
    description="Streams an uploaded file (PDF/TXT/MD), extracts text, generates overlapping semantic chunks, computes 768-dim embeddings + tsvectors, and batch-inserts them into PostgreSQL.",
)
async def upload_document(
    file: UploadFile = File(..., description="Document file to ingest (.pdf, .txt, .md, .markdown)"),
    session: AsyncSession = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing.",
        )

    _, ext = os.path.splitext(file.filename)
    normalized_ext = ext.lower()
    if normalized_ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
        )

    # 1. Safely stream/read file bytes
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    # 2. Extract text according to file extension
    try:
        raw_text = extract_text_from_file(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to extract text from file: {str(e)}",
        )

    cleaned_text = raw_text.strip()
    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No readable text could be extracted from the file.",
        )

    # 3. Recursive character chunking
    chunks = chunk_text(cleaned_text)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to generate semantic chunks from the document content.",
        )

    # 4. Prepare metadata tracking
    metadatas = [
        {
            "source": file.filename,
            "chunk_index": i,
            "total_chunks": len(chunks),
            "content_type": file.content_type or "application/octet-stream",
        }
        for i in range(len(chunks))
    ]

    # 5. Batch vector embeddings, tsvector calculation, and PostgreSQL storage
    try:
        doc = await store_document(
            filename=file.filename,
            file_type=normalized_ext.lstrip("."),
            chunks=chunks,
            metadatas=metadatas,
            session=session,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database storage failed during ingestion: {str(e)}",
        )

    return DocumentUploadResponse(
        status="success",
        document_id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        chunks_created=len(chunks),
        message=f"Successfully ingested and indexed {len(chunks)} chunks from '{file.filename}'.",
    )


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List all ingested documents",
    description="Returns all ingested documents with their respective chunk counts and creation timestamps.",
)
async def list_documents(
    session: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Document.id,
            Document.filename,
            Document.file_type,
            Document.created_at,
            func.count(Chunk.id).label("chunk_count"),
        )
        .outerjoin(Chunk, Document.id == Chunk.document_id)
        .group_by(Document.id)
        .order_by(Document.created_at.desc())
    )
    result = await session.execute(stmt)
    rows = result.all()

    documents = [
        DocumentItem(
            id=row.id,
            filename=row.filename,
            file_type=row.file_type,
            created_at=row.created_at,
            chunk_count=row.chunk_count,
        )
        for row in rows
    ]

    return DocumentListResponse(
        documents=documents,
        total=len(documents),
    )


@router.delete(
    "/{document_id}",
    summary="Delete a document and its chunks",
    description="Deletes a document by UUID, cascading deletion to all its associated chunks.",
)
async def delete_document(
    document_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Document).where(Document.id == document_id)
    result = await session.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found.",
        )

    await session.delete(doc)
    await session.commit()

    return {
        "status": "success",
        "deleted_document_id": str(document_id),
        "message": f"Successfully deleted document '{doc.filename}' and all associated chunks.",
    }
