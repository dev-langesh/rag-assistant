import asyncio
from app.services.ingestion import extract_text_from_file, chunk_text
from app.services.storage import store_document
from init_db import AsyncSessionLocal
from models import Document, Chunk
from sqlalchemy import select

sample_document = b"""# RAG Architecture Deep Dive
Retrieval-Augmented Generation (RAG) is an AI framework for improving the quality of LLM-generated responses by grounding the model on external sources of knowledge.
Traditional language models rely solely on parameters learned during training, which can lead to hallucinated facts or outdated information.
By integrating external retrieval systems, RAG provides factual accuracy, domain adaptability, and verifiable citations.

## Vector Embeddings and Dense Retrieval
Dense vectors map chunks of natural language text into a continuous semantic coordinate space.
By computing cosine similarity between query and passage vectors, the system retrieves semantically relevant information even when exact keywords differ.
Models like BGE and Nomic project sentences into 768-dimensional latent representations that capture thematic relationships and subtle context.

## Full-Text Search and Keyword Matching
Lexical search using inverted indexes (PostgreSQL tsvector) excels at specific keywords, abbreviations, and exact identifiers.
Tokenizers strip stopwords, stem words into normalized root forms, and construct sparse posting lists for millisecond-latency matching.

## Hybrid Search & Reciprocal Rank Fusion
Combining dense semantic embeddings with sparse lexical tsvector indexes provides robust hybrid search capabilities.
Reciprocal Rank Fusion (RRF) scores items from both retrieval methods to produce unified candidate rankings with superior precision and recall.
"""


async def main():
    print("1. Extracting text...")
    raw_text = extract_text_from_file(sample_document, "rag_guide.md")

    print("2. Chunking text...")
    chunks = chunk_text(raw_text)
    print(f"Generated {len(chunks)} chunks.")

    print("3. Generating embeddings & storing in PostgreSQL...")
    doc = await store_document(
        filename="rag_guide.md",
        file_type="markdown",
        chunks=chunks,
        metadatas=[{"source": "rag_guide.md", "chunk_index": i} for i in range(len(chunks))],
    )
    print(f"Document stored successfully with ID: {doc.id}")

    print("4. Verifying stored records in PostgreSQL...")
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Chunk).where(Chunk.document_id == doc.id)
        )
        stored_chunks = result.scalars().all()
        print(f"Found {len(stored_chunks)} stored chunks for document in database.")
        for idx, chunk in enumerate(stored_chunks, 1):
            emb_len = len(chunk.embedding) if chunk.embedding is not None else 0
            print(f"\n--- Stored Chunk {idx} ---")
            print(f"Chunk ID: {chunk.id}")
            print(f"Content Preview: {chunk.content[:60]}...")
            print(f"Metadata: {chunk.metadata_}")
            print(f"Embedding Vector Dimension: {emb_len}")
            print(f"PostgreSQL TSVector: {chunk.tsv}")


if __name__ == "__main__":
    asyncio.run(main())
