from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
from uuid import UUID, uuid4
from typing import Optional
import json

# ✅ Consolidated Imports (Added dbt_utils)
from app.api.router import route_intent
from app.llm.ollama import call_llm_stream 
from app.dbt_utils import get_dbt_context  # <--- NEW IMPORT
from app.db import (
    init_db, 
    insert_message, 
    get_all_chats, 
    get_messages, 
    get_db_schema, 
    run_read_only_sql
)

# Setup Paths
ROOT_DIR = Path(__file__).resolve().parents[2]
WEB_DIR  = ROOT_DIR / "app" / "web"

app = FastAPI(title="DE AI Assistant")

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Serve static assets
app.mount("/static", StaticFiles(directory=str(WEB_DIR)), name="static")

# --- Request Models ---
class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None

class RunSQLRequest(BaseModel):
    query: str

class FixSQLRequest(BaseModel):
    query: str
    error: str

# --- Base Endpoints ---
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/", include_in_schema=False)
def root():
    return FileResponse(str(WEB_DIR / "index.html"))

# Handle favicon to clean logs
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {"status": "no icon"}

# --- Sidebar Endpoints ---
@app.get("/chats")
def list_chats():
    chats = get_all_chats()
    return [{"id": c, "title": f"Chat {c[:8]}..."} for c in chats]

@app.get("/chats/{chat_id}")
def load_chat_history(chat_id: str):
    messages = get_messages(chat_id)
    return {"messages": messages}

# --- Agent Endpoints ---
@app.post("/run-sql")
def run_sql(req: RunSQLRequest):
    """Executes a read-only SQL query against the connected DB."""
    result = run_read_only_sql(req.query)
    return result

@app.post("/fix-sql")
def fix_sql(req: FixSQLRequest):
    """Self-Healing: Fixes broken SQL using Schema awareness."""
    schema = get_db_schema()
    
    system_prompt = (
        "You are a SQL Debugging Expert.\n"
        "Your task: Fix the broken SQL query based on the error message and the schema.\n"
        "Rules:\n"
        "- Output ONLY the corrected SQL query.\n"
        "- Do NOT output markdown, explanations, or backticks.\n"
        f"Database Schema:\n{schema}"
    )
    
    user_prompt = (
        f"Broken Query:\n{req.query}\n\n"
        f"Error Message:\n{req.error}\n\n"
        "Corrected SQL:"
    )

    full_fixed_sql = ""
    for chunk in call_llm_stream(system_prompt, user_prompt):
        full_fixed_sql += chunk
        
    cleaned_sql = full_fixed_sql.replace("```sql", "").replace("```", "").strip()
    return {"fixed_query": cleaned_sql}

# --- Main Chat Endpoint ---
@app.post("/chat")
def chat(req: ChatRequest):
    # 1. Handle Chat ID
    try:
        current_chat_id = UUID(req.chat_id) if req.chat_id else uuid4()
    except ValueError:
        current_chat_id = uuid4()
    
    chat_id_str = str(current_chat_id)

    # 2. Save User Message
    insert_message(chat_id_str, "user", req.message, scope=None)

    # 3. Router Logic
    routed = route_intent(req.message)

    if routed["scope"] in ["welcome", "out_of_scope", "meta"]:
        final_answer = routed.get("welcome_answer") or routed.get("answer") or ""
        insert_message(chat_id_str, "assistant", final_answer, scope=routed["scope"])
        return {"chat_id": chat_id_str, "scope": routed["scope"], "answer": final_answer}

    # 4. Fetch Contexts (The Brain Upgrade 🧠)
    real_schema = get_db_schema()
    dbt_context = get_dbt_context() # <--- Fetches dbt lineage

    # 5. Build System Prompt
    system_prompt = (
        "You are a senior Data Engineering assistant.\n"
        "Hard rules:\n"
        "- Stay strictly in Data Engineering scope\n"
        "- Use ONLY the provided context if present\n"
        "- If writing SQL, use the SCHEMA below.\n"
        "- If asked about lineage or transformations, use the DBT CONTEXT below.\n\n"
        f"=== SQL SERVER SCHEMA ===\n{real_schema}\n\n"
        f"=== DBT PROJECT STRUCTURE ===\n{dbt_context}\n\n"
        "- Format: 1) Short answer 2) Steps 3) Code 4) Check command"
    )

    user_prompt = (
        f"User question:\n{req.message}\n\n"
        f"Context (RAG):\n{routed.get('context', '')}\n"
    )

    # 6. Streaming Generator
    def answer_generator():
        full_response = ""
        meta_data = json.dumps({"chat_id": chat_id_str, "scope": routed["scope"]})
        yield meta_data + "\n"

        for chunk in call_llm_stream(system_prompt, user_prompt):
            full_response += chunk
            yield chunk

        insert_message(chat_id_str, "assistant", full_response, scope=routed["scope"])

    return StreamingResponse(answer_generator(), media_type="text/plain")