import asyncio
import sys
from app.services.llm import (
    SYSTEM_INSTRUCTION,
    format_xml_context,
    build_grounded_user_prompt,
    generate_rag_response,
    stream_rag_response,
    get_gemini_client,
)
from app.services.reranking import retrieve_and_rerank

# Mock chunks for isolated prompt testing
mock_chunks = [
    {
        "id": "e666ff00-95ed-4405-b46a-dfd61487fd76",
        "filename": "rag_guide.md",
        "content": "Retrieval-Augmented Generation (RAG) is an AI framework for improving the quality of LLM-generated responses by grounding the model on external sources of knowledge.",
    },
    {
        "id": "1db756ab-ea5e-4139-bcdf-da37aa123a5e",
        "filename": "rag_guide.md",
        "content": "Dense vectors map chunks of natural language text into a continuous semantic coordinate space. By computing cosine similarity between query and passage vectors, the system retrieves relevant information.",
    },
]


async def run_full_pipeline_test():
    print("=" * 75)
    print("1. PROMPT ENGINEERING & XML FORMATTING VALIDATION")
    print("=" * 75)
    xml_output = format_xml_context(mock_chunks)
    print(xml_output)

    # Validate Gemini client initialization
    try:
        get_gemini_client()
        print("\n✓ Gemini client initialized successfully with API key.")
    except Exception as e:
        print(f"\n✗ Gemini client initialization failed: {e}")
        return

    print("\n" + "=" * 75)
    print("2. TEST GROUNDED QUESTION WITH INLINE CITATIONS")
    print("=" * 75)
    query_grounded = "What is RAG and how do dense vectors retrieve information?"
    print(f"Query: '{query_grounded}'\n")
    response_grounded = await generate_rag_response(
        query=query_grounded,
        chunks=mock_chunks,
    )
    print("Gemini Grounded Response:")
    print(response_grounded)

    # Check for citation anchors [chunk_id]
    citations_found = [
        c["id"] for c in mock_chunks if f"[{c['id']}]" in response_grounded
    ]
    print(f"\n✓ Detected Inline Citations: {citations_found}")

    print("\n" + "=" * 75)
    print("3. TEST NEGATIVE CONSTRAINT (UNANSWERABLE QUESTION)")
    print("=" * 75)
    query_unanswerable = "What is the secret recipe for Martian space pie?"
    print(f"Query: '{query_unanswerable}'\n")
    response_negative = await generate_rag_response(
        query=query_unanswerable,
        chunks=mock_chunks,
    )
    print("Gemini Refusal Response:")
    print(response_negative)

    print("\n" + "=" * 75)
    print("4. TEST REAL-TIME TOKEN STREAMING (SSE SIMULATION)")
    print("=" * 75)
    query_stream = "Briefly explain how cosine similarity is used."
    print(f"Query: '{query_stream}'\nStreaming Tokens: ", end="", flush=True)

    token_count = 0
    async for token in stream_rag_response(query=query_stream, chunks=mock_chunks):
        sys.stdout.write(token)
        sys.stdout.flush()
        token_count += 1
    print(f"\n\n✓ Successfully streamed {token_count} token chunks.")

    print("\n" + "=" * 75)
    print("5. COMPLETE END-TO-END TEST (POSTGRES HYBRID RRF + FLASHRANK + GEMINI)")
    print("=" * 75)
    query_e2e = "Why does combining full-text search with dense vectors improve RAG retrieval?"
    print(f"User Query: '{query_e2e}'")
    print("Retrieving & re-ranking from PostgreSQL...")

    # Stage 1 + Stage 2
    reranked_chunks = await retrieve_and_rerank(query=query_e2e, final_top_k=3)
    print(f"Retrieved and re-ranked {len(reranked_chunks)} top passages from database.")

    for idx, r in enumerate(reranked_chunks, 1):
        print(f"  [{idx}] Chunk ID: {r.id} | Score: {r.rerank_score:.4f} | {r.content.strip()[:65]}...")

    print("\nGenerating grounded answer using live retrieved context...")
    e2e_response = await generate_rag_response(
        query=query_e2e,
        chunks=reranked_chunks,
    )
    print("\nGemini End-to-End Grounded Answer:")
    print(e2e_response)
    print("\n" + "=" * 75)
    print("PIPELINE TEST COMPLETED SUCCESSFULLY!")
    print("=" * 75)


if __name__ == "__main__":
    asyncio.run(run_full_pipeline_test())
