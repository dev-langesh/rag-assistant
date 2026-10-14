import io
import re
from typing import List
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 600 characters/tokens with 100 overlap preserves sentence coherence
splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=120,
    separators=["\n\n", "\n", ". ", " ", ""],
    length_function=len,
)

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    # Extracts raw text based on file extension.
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        extracted_pages = []
        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                # Normalize word-broken lines (e.g. \n \n between individual words)
                words = page_text.split()
                line_count = page_text.count("\n")
                if len(words) > 0 and line_count > len(words) * 0.3:
                    page_text = " ".join(words)
                    page_text = re.sub(r"(?<!^)(\b\d+\.\s+[A-Z])", r"\n\n\1", page_text)
                    page_text = re.sub(r"(?<!^)([•\-]\s+[A-Z])", r"\n\n\1", page_text)
                extracted_pages.append(page_text)
        return "\n\n".join(extracted_pages)
    
    # Defaults to utf-8 text (txt, md, markdown)
    return file_bytes.decode("utf-8", errors="ignore")

def chunk_text(text: str) -> List[str]:
    # Splits raw text into overlapping semantic chunks.
    cleaned_text = text.strip()
    if not cleaned_text:
        return []
    return splitter.split_text(cleaned_text)
