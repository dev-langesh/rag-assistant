import asyncio
from app.services.retrieval import hybrid_search


async def run_query(query: str, query_type: str):
    print(f"\n========================================================")
    print(f"[{query_type}] Query: '{query}'")
    print(f"========================================================")

    results = await hybrid_search(query=query, limit=3)
    if not results:
        print("No matching results found.")
        return

    for idx, res in enumerate(results, 1):
        dense_str = f"#{res.rank_dense}" if res.rank_dense is not None else "None"
        sparse_str = f"#{res.rank_sparse}" if res.rank_sparse is not None else "None"
        print(f"\nResult {idx} | RRF Score: {res.rrf_score:.5f}")
        print(f"  Dense Rank:  {dense_str}")
        print(f"  Sparse Rank: {sparse_str}")
        print(f"  Document:    {res.filename}")
        print(f"  Content Preview: {res.content.strip()[:140]}...")


async def main():
    # 1. Keyword-Heavy Query (Tests PostgreSQL tsvector / BM25 matching)
    await run_query(
        query="tsvector inverted indexes keyword matching",
        query_type="KEYWORD-HEAVY QUERY",
    )

    # 2. Concept / Semantic-Heavy Query (Tests Dense Vector cosine similarity without exact keywords)
    await run_query(
        query="preventing artificial intelligence from hallucinating incorrect facts",
        query_type="CONCEPT-HEAVY QUERY",
    )

    # 3. Hybrid Query (Matches both conceptual intent and specific technical terms)
    await run_query(
        query="reciprocal rank fusion RRF candidate ranking precision",
        query_type="HYBRID BALANCED QUERY",
    )


if __name__ == "__main__":
    asyncio.run(main())
