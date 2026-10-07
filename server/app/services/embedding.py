from typing import List, Sequence
from fastembed import TextEmbedding

# BAAI/bge-base-en-v1.5 produces 768-dimensional vectors matching the Vector(768) column
DEFAULT_MODEL_NAME = "BAAI/bge-base-en-v1.5"

_model: TextEmbedding | None = None


def get_embedding_model(model_name: str = DEFAULT_MODEL_NAME) -> TextEmbedding:
    """Returns a singleton instance of the FastEmbed TextEmbedding model."""
    global _model
    if _model is None:
        _model = TextEmbedding(model_name=model_name)
    return _model


def generate_embeddings(texts: Sequence[str], model_name: str = DEFAULT_MODEL_NAME) -> List[List[float]]:
    """Generates dense vector embeddings (768-dim) for a list of texts."""
    if not texts:
        return []
    model = get_embedding_model(model_name)
    embeddings = list(model.embed(texts))
    return [e.tolist() if hasattr(e, "tolist") else list(e) for e in embeddings]


def generate_query_embedding(query: str, model_name: str = DEFAULT_MODEL_NAME) -> List[float]:
    """Generates a dense vector embedding (768-dim) for a single query."""
    return generate_embeddings([query], model_name=model_name)[0]
