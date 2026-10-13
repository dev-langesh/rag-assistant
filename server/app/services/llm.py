import os
from typing import Any, AsyncGenerator, List, Optional, Sequence
from google import genai
from google.genai import types

from app.core.config import settings

# Strict closed-domain system prompt ensuring hallucination mitigation and inline citation anchors
SYSTEM_INSTRUCTION = """You are a precise, strictly grounded RAG (Retrieval-Augmented Generation) assistant.
Your job is to answer user questions truthfully, accurately, and solely based on the provided context sources.

STRICT GROUNDING CONSTRAINTS:
1. Source Faithfulness: Answer the question using ONLY the facts explicitly mentioned in the <sources> XML block. Do NOT use outside knowledge, pre-trained assumptions, or unstated facts.
2. Negative Constraint: If the provided sources do not contain the answer, or if there is insufficient information to answer the question with certainty, you MUST state: "I do not have enough information in the provided documents to answer this question." Do not fabricate or speculate.
3. Inline XML Citation Anchors: Every factual assertion or answer statement you make MUST include an inline citation indicating the source chunk ID in brackets: `[chunk_uuid]`.
   - Place the bracketed citation immediately after the referenced claim.
   - Example: "Dense vectors represent semantic concepts in continuous coordinate spaces [e666ff00-95ed-4405-b46a-dfd61487fd76]."
   - If multiple chunks support a claim, append each citation anchor: e.g., "[id_1][id_2]".
   - ONLY cite IDs present inside the provided <chunk id="..."> tags. Never invent an ID.
4. Direct & Objective Tone: Be direct, clear, and objective. Avoid meta-commentary like "According to the XML sources".
"""


def get_gemini_client(api_key: Optional[str] = None) -> genai.Client:
    """Returns an authenticated Google GenAI client instance."""
    key = api_key or settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not key or key in ("your_gemini_api_key_here", "your-gemini-api-key-here"):
        raise ValueError(
            "GEMINI_API_KEY is not set. Please update your GEMINI_API_KEY in server/.env"
        )
    return genai.Client(api_key=key)


def format_xml_context(chunks: Sequence[Any]) -> str:
    """
    Formats retrieved and re-ranked chunks into structured XML context tags:
    <sources>
      <chunk id="chunk_uuid" document="filename.pdf">
        chunk_content
      </chunk>
    </sources>
    """
    if not chunks:
        return "<sources>\n</sources>"

    chunk_elements = []
    for c in chunks:
        if hasattr(c, "id") and hasattr(c, "content"):
            chunk_id = str(c.id)
            content = str(c.content).strip()
            filename = getattr(c, "filename", None)
        elif isinstance(c, dict):
            chunk_id = str(c.get("id", ""))
            content = str(c.get("content", c.get("text", ""))).strip()
            filename = c.get("filename")
        else:
            continue

        doc_attr = f' document="{filename}"' if filename else ""
        chunk_elements.append(
            f'  <chunk id="{chunk_id}"{doc_attr}>\n    {content}\n  </chunk>'
        )

    return "<sources>\n" + "\n".join(chunk_elements) + "\n</sources>"


def build_grounded_user_prompt(query: str, chunks: Sequence[Any]) -> str:
    """Combines structured XML sources and user question into the grounded prompt."""
    xml_context = format_xml_context(chunks)
    return f"""Context Sources:
{xml_context}

User Question: {query}"""


import asyncio
FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-flash-latest"]


async def stream_rag_response(
    query: str,
    chunks: Sequence[Any],
    model: Optional[str] = None,
    api_key: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Streams response tokens from Gemini with strict negative constraints and inline citations.
    Includes automatic fallback across flash models on transient server spikes.
    """
    client = get_gemini_client(api_key=api_key)
    model_name = model or settings.GEMINI_MODEL
    prompt = build_grounded_user_prompt(query=query, chunks=chunks)

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        temperature=0.0,
    )

    models_to_try = [model_name] + [m for m in FALLBACK_MODELS if m != model_name]
    last_error = None

    for m in models_to_try:
        try:
            response_stream = await client.aio.models.generate_content_stream(
                model=m,
                contents=prompt,
                config=config,
            )
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as exc:
            last_error = exc
            err_str = str(exc)
            if any(code in err_str for code in ("503", "429", "500", "UNAVAILABLE", "RESOURCE_EXHAUSTED")):
                await asyncio.sleep(1)
                continue
            raise exc

    if last_error:
        raise last_error


async def generate_rag_response(
    query: str,
    chunks: Sequence[Any],
    model: Optional[str] = None,
    api_key: Optional[str] = None,
) -> str:
    """
    Generates a complete non-streaming grounded response from Gemini with transient fallback.
    """
    client = get_gemini_client(api_key=api_key)
    model_name = model or settings.GEMINI_MODEL
    prompt = build_grounded_user_prompt(query=query, chunks=chunks)

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        temperature=0.0,
    )

    models_to_try = [model_name] + [m for m in FALLBACK_MODELS if m != model_name]
    last_error = None

    for m in models_to_try:
        try:
            response = await client.aio.models.generate_content(
                model=m,
                contents=prompt,
                config=config,
            )
            return response.text or ""
        except Exception as exc:
            last_error = exc
            err_str = str(exc)
            if any(code in err_str for code in ("503", "429", "500", "UNAVAILABLE", "RESOURCE_EXHAUSTED")):
                continue
            raise exc

    if last_error:
        raise last_error

