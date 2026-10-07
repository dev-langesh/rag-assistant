import os
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from models import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://rag_user:rag_password@localhost:5432/rag_db")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        # Enable pgvector extension inside PostgreSQL
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        # Create all tables and HNSW / GIN indexes
        await conn.run_sync(Base.metadata.create_all)
    print("Database schema and vector indexes created successfully.")