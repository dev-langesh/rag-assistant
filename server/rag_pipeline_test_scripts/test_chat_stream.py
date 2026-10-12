import asyncio
import json
import os
import sys

# Ensure server root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import ASGITransport, AsyncClient
from app.main import app


async def test_sse_streaming():
    print("=" * 75)
    print("1. TESTING SSE STREAMING CHAT (POST /api/v1/chat/stream)")
    print("=" * 75)

    transport = ASGITransport(app=app)
    query = "What is a Buyer and how does the financial holding mechanism work for buyer funds?"
    payload = {"query": query, "top_k": 3}

    print(f"Query: '{query}'\n")

    citations_received = None
    accumulated_response = []
    events_received = []

    async with AsyncClient(transport=transport, base_url="http://test", timeout=30.0) as client:
        async with client.stream("POST", "/api/v1/chat/stream", json=payload) as response:
            assert response.status_code == 200
            assert "text/event-stream" in response.headers.get("content-type", "")

            print("✓ Connection established with Content-Type: text/event-stream\n")

            current_event = None
            async for line in response.aiter_lines():
                if not line.strip():
                    continue

                if line.startswith("event: "):
                    current_event = line[len("event: "):].strip()
                    events_received.append(current_event)
                elif line.startswith("data: ") and current_event:
                    data_str = line[len("data: "):].strip()

                    if current_event == "citations":
                        citations_received = json.loads(data_str)
                        print(f"📦 [event: citations] Received {len(citations_received)} source citations:")
                        for idx, c in enumerate(citations_received, 1):
                            print(f"   [{idx}] ID: {c['id']} | Score: {c['score']} | {c['content'].strip()[:60]}...")
                        print("\n💬 [event: message] Streaming tokens: ", end="", flush=True)

                    elif current_event == "message":
                        msg_data = json.loads(data_str)
                        token = msg_data.get("token", "")
                        accumulated_response.append(token)
                        sys.stdout.write(token)
                        sys.stdout.flush()

                    elif current_event == "done":
                        done_data = json.loads(data_str)
                        print(f"\n\n🏁 [event: done] Stream finished with status: {done_data.get('status')}")

    full_text = "".join(accumulated_response)
    print("\n" + "-" * 75)
    print("Accumulated Grounded Response:")
    print(full_text)
    print("-" * 75)

    # Verification assertions
    assert "citations" in events_received, "Expected 'citations' event in stream"
    assert "message" in events_received, "Expected 'message' event in stream"
    assert "done" in events_received, "Expected 'done' event in stream"
    assert citations_received is not None and len(citations_received) > 0, "Expected non-empty citations"
    assert len(accumulated_response) > 0, "Expected streamed tokens"

    print("\n" + "=" * 75)
    print("2. TESTING SYNCHRONOUS CHAT (POST /api/v1/chat)")
    print("=" * 75)
    async with AsyncClient(transport=transport, base_url="http://test", timeout=30.0) as client:
        res = await client.post("/api/v1/chat", json={"query": query, "top_k": 2})
        assert res.status_code == 200
        sync_data = res.json()
        print(f"Sync Answer Preview: {sync_data['answer'][:120]}...")
        print(f"Total Citations Returned: {len(sync_data['citations'])}")

    print("\n✓ SSE STREAMING & CITATIONS CHAT ENDPOINT VERIFIED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(test_sse_streaming())
