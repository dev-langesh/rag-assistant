import asyncio
import time
from app.services.retrieval import hybrid_search
from app.services.reranking import rerank_results, retrieve_and_rerank


async def test_two_stage_pipeline(query: str):
    print("=" * 70)
    print(f"QUERY: '{query}'")
    print("=" * 70)

    # Stage 1: Fast Hybrid RRF Retrieval
    start_s1 = time.perf_counter()
    candidates = await hybrid_search(query=query, limit=10)
    elapsed_s1 = (time.perf_counter() - start_s1) * 1000

    print(f"\n[Stage 1: Hybrid Retrieval] Found {len(candidates)} candidates in {elapsed_s1:.2f}ms")
    for idx, c in enumerate(candidates, 1):
        dense_str = f"#{c.rank_dense}" if c.rank_dense is not None else "None"
        sparse_str = f"#{c.rank_sparse}" if c.rank_sparse is not None else "None"
        print(f"  Candidate {idx}: RRF={c.rrf_score:.5f} (Dense={dense_str}, Sparse={sparse_str}) | {c.content.strip()[:70]}...")

    # Stage 2: Cross-Encoder Re-Ranking with FlashRank
    start_s2 = time.perf_counter()
    reranked = rerank_results(query=query, candidates=candidates, top_k=3)
    elapsed_s2 = (time.perf_counter() - start_s2) * 1000

    print(f"\n[Stage 2: FlashRank Cross-Encoder] Re-ranked top {len(reranked)} results in {elapsed_s2:.2f}ms")
    for idx, r in enumerate(reranked, 1):
        rank_shift = f"(was #{r.initial_rank})" if r.initial_rank != idx else "(unchanged)"
        print(f"\n  Rank #{idx} {rank_shift} | Cross-Encoder Score: {r.rerank_score:.6f}")
        print(f"    Original RRF Score: {r.initial_rrf_score:.5f}")
        print(f"    Document:           {r.filename}")
        print(f"    Content:            {r.content.strip()[:130]}...")


async def main():
    # Test 1: Nuanced technical query requiring token-level attention
    await test_two_stage_pipeline("How does Reciprocal Rank Fusion combine rankings from two retrieval systems?")

    # Test 2: Specific keyword & concept query
    await test_two_stage_pipeline("Why do vector embeddings map text into coordinate spaces?")


if __name__ == "__main__":
    asyncio.run(main())
