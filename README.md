# Hybrid RAG Engine & Grounded Assistant

A production-ready, full-stack **Hybrid Retrieval-Augmented Generation (RAG)** platform featuring multi-stage retrieval (Dense Vector + Sparse Full-Text Search with Reciprocal Rank Fusion), Cross-Encoder Re-Ranking, token-by-token Server-Sent Events (SSE) streaming, and strictly grounded paragraph-level source citations.

---

## Key Features

- **Hybrid Two-Stage Retrieval**:
  - **Dense Vector Search**: Powered by `FastEmbed` (`BAAI/bge-base-en-v1.5`, 768-dimensional embeddings) indexed with `pgvector` HNSW cosine distance.
  - **Sparse Full-Text Search**: Native PostgreSQL `tsvector` with English stemming and GIN index for exact keyword, acronym, and numeric term matching.
  - **Reciprocal Rank Fusion (RRF)**: Merges dense and sparse result lists using rank reciprocals ($k=60$) to achieve superior retrieval accuracy over single-modality search.
- **Cross-Encoder Re-Ranking**:
  - Re-scores top candidates using `FlashRank` (`ms-marco-TinyBERT-L-2-v2`) to prioritize passages with the highest semantic relevance before passing context to the LLM.
- **Strictly Grounded Inline Paragraph Citations**:
  - Automatically identifies all chunk UUIDs cited across each paragraph or bullet point.
  - Strips raw UUID bracket clutter from the message text and aggregates cited chunk IDs into a clean inline badge at the end of each paragraph (e.g., `[1 Source]`, `[2 Sources]`).
- **Interactive Source Citation Inspector**:
  - Slide-out drawer lists grounded passages chunk-by-chunk with document filename, chunk ID, re-rank relevance score, initial RRF score, 1-click passage copy, and clean continuous paragraph formatting.
- **Multi-Format Document Ingestion Pipeline**:
  - Drag-and-drop file ingestion supporting **PDF**, **Markdown (`.md`)**, and **Plain Text (`.txt`)**.
  - Intelligent PDF text sanitization eliminating line-broken word extraction artifacts.
  - Chunked via `RecursiveCharacterTextSplitter` (800 characters, 120 character overlap).
  - Document deletion with cascading chunk cleanup.
- **Real-Time Token-by-Token SSE Streaming**:
  - High-throughput Server-Sent Events (`/api/v1/chat/stream`) with cancellation support via `AbortController`.
- **Persistent Conversation History**:
  - Saves user prompts, assistant answers, and citation snapshots to PostgreSQL.
  - Loads chat history automatically on page load; includes one-click chat history clearing.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router, Standalone Output), React 19, TypeScript, TailwindCSS v4 |
| **Backend** | FastAPI, Python 3.12, Uvicorn, Pydantic v2, Google GenAI SDK |
| **Database & ORM** | PostgreSQL 17, `pgvector`, SQLAlchemy 2.0 (AsyncIO), `asyncpg` |
| **ML & NLP** | FastEmbed (ONNX Runtime), FlashRank, LangChain Text Splitters, PyPDF |
| **LLM Provider** | Google Gemini (`gemini-2.5-flash`) 

---

## Quick Start (Docker Compose)

### 1. Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/) (v2+)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 2. Configure Environment Variables

Create a `.env` file inside ./server:

```bash
cd server
cp .env.example .env
```

Edit `.env` and set your Gemini API key:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Build & Run Services

Start all services (`pgvector`, `server`, `client`) in the background:

```bash
docker compose up --build -d
```
---

## REST & Streaming API Reference

The backend provides OpenAPI documentation at `http://localhost:8000/docs`. Key endpoints include:

### Documents API (`/api/v1/documents`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/documents/upload` | Upload and ingest a document (`.pdf`, `.md`, `.txt`) with chunking & embedding generation |
| `GET` | `/api/v1/documents/` | List all ingested documents with status and chunk counts |
| `GET` | `/api/v1/documents/{document_id}` | Retrieve document metadata and child chunk list |
| `DELETE` | `/api/v1/documents/{document_id}` | Delete document and cascade delete all its stored chunks and embeddings |

### Chat API (`/api/v1/chat`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/chat/stream` | **Server-Sent Events (SSE)** endpoint streaming tokens, citations, and completion status |
| `POST` | `/api/v1/chat` | Synchronous RAG endpoint returning full answer and top citations in JSON |
| `GET` | `/api/v1/chat/history` | Retrieve persistent conversation history from PostgreSQL |
| `DELETE` | `/api/v1/chat/history` | Clear persistent conversation history |

### Health Checks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server and database health check (used by Docker healthcheck) |
| `GET` | `/` | Root API metadata and service info |

---

## License

This project is licensed under the MIT License.
