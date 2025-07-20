import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import fitz  # PyMuPDF
import google.generativeai as genai
import os
from dotenv import load_dotenv

# --- Load environment variables from .env ---
load_dotenv()
GEMINI_API_KEY = "AIzaSyC9OCovP1v3jJVkcLlpzsRafSo0tI7n3mc"
if not GEMINI_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY not set in .env file.")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# Allow CORS for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store: session_id -> {"pages": [str, ...]}
sessions: Dict[str, Dict[str, List[str]]] = {}


class ChatRequest(BaseModel):
    session_id: str
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:  # 50MB
        raise HTTPException(status_code=400, detail="File too large (max 50MB).")
    # Extract text per page
    try:
        doc = fitz.open(stream=contents, filetype="pdf")
        pages = [page.get_text() for page in doc]
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process PDF: {e}")
    # Auto-summarization using Gemini
    max_chars = 12000
    doc_text = "\n".join([f"[Page {i+1}]\n{page}" for i, page in enumerate(pages)])
    if len(doc_text) > max_chars:
        doc_text = doc_text[:max_chars]
    summary_prompt = f"""
You are an expert assistant. Summarize the following document in 3-5 concise sentences, highlighting the main topics, purpose, and any key sections. Do not repeat the document verbatim. Be clear and helpful.

Document:
{doc_text}

Summary:
"""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        summary_response = model.generate_content(summary_prompt)
        summary = summary_response.text.strip()
    except Exception as e:
        print("Gemini Vision error (summary):", e)
        summary = "Summary not available."
    session_id = str(uuid.uuid4())
    sessions[session_id] = {"pages": pages, "summary": summary}
    return {"session_id": session_id, "summary": summary}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session = sessions.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    pages = session["pages"]
    max_chars = 24000
    doc_text = "\n".join([f"[Page {i+1}]\n{page}" for i, page in enumerate(pages)])
    if len(doc_text) > max_chars:
        doc_text = doc_text[:max_chars]
    # RAG-style prompt for NotebookLM-like behavior, improved for conversational answers
    prompt = f"""
You are a helpful AI assistant for document Q&A, similar to NotebookLM.
You are given a document split into pages. Answer the user's question using ONLY the information from the document below.
- If the question is broad (e.g., 'What is in the attached document?'), provide a concise, high-level summary in 2-4 sentences, not a full extraction.
- If the question is specific, answer directly and concisely, citing page numbers (e.g., [Page 2]) if possible.
- Do NOT just repeat or dump the document text.
- If the answer is not present, say: "I couldn't find the answer in the provided document."

Document:
{doc_text}

User Question: {req.question}

Answer (in a conversational, helpful style):
"""
    try:
        print("Available models:", genai.list_models())  # For debugging
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        answer = response.text.strip()
    except Exception as e:
        print("Gemini Vision error:", e)
        raise HTTPException(status_code=500, detail=f"Gemini Vision error: {e}")
    return ChatResponse(answer=answer, sources=None)


class MultiChatRequest(BaseModel):
    session_ids: List[str] = Field(
        ..., description="List of session IDs to include in the context"
    )
    question: str


@app.post("/chat-multi")
async def chat_multi(req: MultiChatRequest):
    # Gather all pages from all session_ids
    all_pages = []
    for idx, sid in enumerate(req.session_ids):
        session = sessions.get(sid)
        if not session:
            continue
        doc_label = f"[Document {idx+1}]"
        pages = [
            f"{doc_label} [Page {i+1}]\n{page}"
            for i, page in enumerate(session["pages"])
        ]
        all_pages.extend(pages)
    if not all_pages:
        raise HTTPException(status_code=404, detail="No valid documents found.")
    max_chars = 48000  # ~16k tokens
    doc_text = "\n".join(all_pages)
    if len(doc_text) > max_chars:
        doc_text = doc_text[:max_chars]
    prompt = f"""
You are a helpful AI assistant for document Q&A, similar to NotebookLM. You are given multiple documents, each split into pages. Answer the user's question using ONLY the information from the provided documents below. Cite document and page numbers (e.g., [Document 2][Page 3]) if possible. If the answer is not present, say so.

Documents:
{doc_text}

User Question: {req.question}

Answer (with citations if possible):
"""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        answer = response.text.strip()
    except Exception as e:
        print("Gemini Vision error (multi):", e)
        raise HTTPException(status_code=500, detail=f"Gemini Vision error: {e}")
    return {"answer": answer}


class MultiSummaryRequest(BaseModel):
    session_ids: List[str] = Field(
        ..., description="List of session IDs to include in the summary"
    )


@app.post("/summary-multi")
async def summary_multi(req: MultiSummaryRequest):
    # Gather all pages from all session_ids
    all_pages = []
    for idx, sid in enumerate(req.session_ids):
        session = sessions.get(sid)
        if not session:
            continue
        doc_label = f"[Document {idx+1}]"
        pages = [
            f"{doc_label} [Page {i+1}]\n{page}"
            for i, page in enumerate(session["pages"])
        ]
        all_pages.extend(pages)
    if not all_pages:
        raise HTTPException(status_code=404, detail="No valid documents found.")
    max_chars = 48000  # ~16k tokens
    doc_text = "\n".join(all_pages)
    if len(doc_text) > max_chars:
        doc_text = doc_text[:max_chars]
    summary_prompt = f"""
You are an expert assistant. Summarize the following documents in 3-5 concise sentences, highlighting the main topics, purpose, and any key sections. Do not repeat the documents verbatim. Be clear and helpful.

Documents:
{doc_text}

Summary:
"""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        summary_response = model.generate_content(summary_prompt)
        summary = summary_response.text.strip()
    except Exception as e:
        print("Gemini Vision error (summary-multi):", e)
        summary = "Summary not available."
    return {"summary": summary}
