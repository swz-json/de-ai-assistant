# app/api/router.py
from app.rag.vectorstore import query_docs

# app/api/router.py

# ✅ UPDATED LIST: Added common action words
DE_KEYWORDS = [
    "sql", "bigquery", "dbt", "airflow", "dag", "pipeline",
    "etl", "elt", "data quality", "dq", "schema",
    "partition", "cluster", "incremental", "model",
    "warehouse", "dataset", "table",
    "count", "show", "list", "select", "data", "rows", "records", "query"
]

META_KEYWORDS = ["purpose", "assistant", "conventions", "help", "what can you do", "scope"]
SMALL_TALK = {"hi", "hello", "hey", "yo", "bonjour"}

# ... (keep the rest of the file exactly the same)

def _retrieve_context(user_message: str) -> str:
    res = query_docs(user_message, n_results=2)
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]

    if not docs:
        return ""

    chunks = []
    for i, d in enumerate(docs):
        src = metas[i].get("source", "docs") if metas and i < len(metas) else "docs"
        chunks.append(f"[Source: {src}]\n{d}")

    return "\n\n---\n\n".join(chunks)

# app/api/router.py

def route_intent(message: str):
    msg = message.strip().lower()
    # 1. ⚡ FAST CHECK: Is it a greeting? (Do this FIRST)
    if msg in SMALL_TALK:
        return {
            "scope": "welcome",
            "context": "",
            "welcome_answer": (
                "Hi 👋 I'm a **Data Engineering Assistant**.\n\n"
                "I can help you with:\n"
                "- Airflow DAGs\n"
                "- dbt models & tests\n"
                "- BigQuery SQL & optimization\n"
                "- Data quality & pipelines"
            )
        }

    # 2. 🐢 SLOW CHECK: Only run RAG if it's NOT a greeting
    context = _retrieve_context(message)

    # meta questions
    if any(k in msg for k in META_KEYWORDS):
        return {"scope": "meta", "context": context}

    # guardrail
    if not any(k in msg for k in DE_KEYWORDS) and not context:
        return {"scope": "out_of_scope", "context": ""}

    scope = "sql"
    if "dbt" in msg:
        scope = "dbt"
    elif "airflow" in msg or "dag" in msg:
        scope = "airflow"
    elif "bigquery" in msg:
        scope = "bigquery"

    return {"scope": scope, "context": context}
