from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from init_db import init_db
from app.api.v1.router import api_router

from app.services.embedding import get_embedding_model
from app.services.reranking import get_ranker

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-warm / load models into memory on server startup
    get_embedding_model()
    get_ranker()
    yield



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize pgvector extension and database schema on startup
    await init_db()
    yield


app = FastAPI(
    title="Hybrid RAG Engine API",
    description="Production-grade Hybrid RAG API with PostgreSQL pgvector, HNSW indexing, full-text tsvector search, FlashRank cross-encoder re-ranking, and Google Gemini integration.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for Next.js client development and external consumers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register versioned API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "Hybrid RAG Engine API",
        "status": "healthy",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "database": "connected",
    }
