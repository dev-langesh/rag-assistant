from app.services.ingestion import chunk_text, extract_text_from_file

sample_content = b"""# RAG Architecture Overview
Retrieval-Augmented Generation (RAG) optimizes the output of an LLM.
It references an authoritative knowledge base outside of its training data sources.

## Vector Search
Dense retrieval maps queries and documents into continuous vector spaces.
It captures conceptual and semantic intent rather than literal keyword matches.
"""

text = extract_text_from_file(sample_content, "overview.md")
chunks = chunk_text(text)

print(f"Total Chunks Generated: {len(chunks)}")
for idx, chunk in enumerate(chunks, 1):
    print(f"--- Chunk {idx} ({len(chunk)} chars) ---\n{chunk}\n")
