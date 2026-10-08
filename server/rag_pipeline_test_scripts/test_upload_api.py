import asyncio
import io
import os
import sys

# Ensure server root is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import ASGITransport, AsyncClient
from app.main import app

SAMPLE_MD_CONTENT = b"""# FastAPI RAG Document Ingestion
FastAPI is a modern, fast (high-performance) web framework for building APIs with Python.
It features automatic interactive documentation via OpenAPI and Swagger UI.

## File Streaming and Ingestion Pipeline
When files are uploaded via HTTP multipart form data, FastAPI buffers the stream efficiently.
Our pipeline takes this stream, extracts raw textual content, splits it recursively into 800-character chunks with 120-character overlaps, computes 768-dimensional dense vectors and sparse tsvectors, and persists everything into PostgreSQL.
"""


async def run_api_tests():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        print("=" * 70)
        print("1. TESTING HEALTH CHECK ENDPOINT (GET /health)")
        print("=" * 70)
        res_health = await client.get("/health")
        print(f"Status: {res_health.status_code}")
        print(f"Response: {res_health.json()}")
        assert res_health.status_code == 200

        print("\n" + "=" * 70)
        print("2. TESTING VALID DOCUMENT UPLOAD (POST /api/v1/documents/upload)")
        print("=" * 70)
        files = {
            "file": ("fastapi_rag.md", io.BytesIO(SAMPLE_MD_CONTENT), "text/markdown")
        }
        res_upload = await client.post("/api/v1/documents/upload", files=files)
        print(f"Status: {res_upload.status_code}")
        upload_data = res_upload.json()
        print(f"Response: {upload_data}")
        assert res_upload.status_code == 201
        doc_id = upload_data["document_id"]
        assert upload_data["chunks_created"] > 0

        print("\n" + "=" * 70)
        print("3. TESTING INVALID FILE FORMAT REJECTION")
        print("=" * 70)
        invalid_files = {
            "file": ("unsupported_data.exe", io.BytesIO(b"binary data"), "application/octet-stream")
        }
        res_invalid = await client.post("/api/v1/documents/upload", files=invalid_files)
        print(f"Status: {res_invalid.status_code}")
        print(f"Response: {res_invalid.json()}")
        assert res_invalid.status_code == 400

        print("\n" + "=" * 70)
        print("4. TESTING DOCUMENT LIST ENDPOINT (GET /api/v1/documents)")
        print("=" * 70)
        res_list = await client.get("/api/v1/documents")
        print(f"Status: {res_list.status_code}")
        list_data = res_list.json()
        print(f"Total Documents Ingested: {list_data['total']}")
        for d in list_data["documents"][:5]:
            print(f"  • [{d['id']}] {d['filename']} ({d['file_type']}) - {d['chunk_count']} chunks")

        print("\n" + "=" * 70)
        print(f"5. TESTING DOCUMENT DELETION (DELETE /api/v1/documents/{doc_id})")
        print("=" * 70)
        res_delete = await client.delete(f"/api/v1/documents/{doc_id}")
        print(f"Status: {res_delete.status_code}")
        print(f"Response: {res_delete.json()}")
        assert res_delete.status_code == 200

        print("\n✓ ALL DOCUMENT INGESTION API ENDPOINTS VERIFIED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(run_api_tests())
