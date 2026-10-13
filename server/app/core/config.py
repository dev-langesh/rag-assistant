from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://rag_user:rag_password@localhost:5432/rag_db"
    )
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemini-3.5-flash-lite")
    EMBEDDING_MODEL: str = Field(default="BAAI/bge-base-en-v1.5")
    RERANK_MODEL: str = Field(default="ms-marco-TinyBERT-L-2-v2")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
