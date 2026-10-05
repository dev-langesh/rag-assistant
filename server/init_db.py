import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from models import Base

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, echo=True)

async def init_db():
    async with engine.begin() as conn:
        # Enable pgvector extension inside PostgreSQL
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        # Create all tables and HNSW / GIN indexes
        await conn.run_sync(Base.metadata.create_all)
    print("Database schema and vector indexes created successfully.")