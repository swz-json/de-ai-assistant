<div align="center">

# DE AI Assistant

**An Agentic RAG platform for Data Engineering.**<br>
*Capable of executing SQL, debugging pipelines, and generating context-aware code.*

[![Status](https://img.shields.io/badge/Status-Production_Ready-success.svg)]()
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Stack](https://img.shields.io/badge/Stack-FastAPI_|_SQL_Server_|_Ollama-purple)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Docker](https://img.shields.io/badge/Docker-Coming_Soon-orange)]()

[English](README.md) | [Documentation](docs/README_DOCS.md) | [Architecture](docs/ARCHITECTURE.md)

<img width="1917" height="903" alt="image" src="https://github.com/user-attachments/assets/f421f37c-f8bf-401d-bd7f-47e69b6498d8" />




</div>

## Requirements

- **Python:** 3.10 or higher
- **Database:** Microsoft SQL Server (Local or Azure)
- **LLM Engine:** Ollama (running `qwen2.5` or `llama3`)
- **Driver:** ODBC Driver 17 for SQL Server
- **Vector Store:** ChromaDB (Embedded)

## Capabilities Matrix

| Feature | Description | Status |
| :--- | :--- | :---: |
| **Schema Awareness** | Reads `sys.tables` to understand your specific DB structure | ✅ |
| **Autonomous Agent** | Can safely execute read-only SQL queries via UI | ✅ |
| **RAG System** | Retrieves context from internal runbooks/docs | ✅ |
| **Streaming** | Real-time token generation (ChatGPT-style) | ✅ |
| **Memory** | Persists conversation history in SQL Server | ✅ |
| **Privacy** | 100% Local inference (No data leaves your network) | ✅ |

## Installation :

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/de-ai-assistant.git](https://github.com/yourusername/de-ai-assistant.git)
cd de-ai-assistant
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
MSSQL_CONN_STR="Driver={ODBC Driver 17 for SQL Server};Server=YOUR_SERVER;Database=DeAiAssistant;Trusted_Connection=yes;"
OLLAMA_URL="[http://127.0.0.1:11434](http://127.0.0.1:11434)"
OLLAMA_MODEL="qwen2.5:7b"
```


## Usage
### Start the Server
#### Run the FastAPI backend with Uvicorn:
```bash
uvicorn app.api.main:app --reload
```

## Access the Interface
+ Open your browser and navigate to: http://localhost:8000

## Agent Commands
### The assistant supports natural language, but also specific agentic triggers:

+ "Count records in [table]..." → Triggers SQL generation.

+ "Debug this error..." → Triggers RAG lookup.

+ "Write a dbt model..." → Triggers code generation mode.

## Architecture
### The system follows a modern **Agentic RAG** architecture:

**1.** **User Input:** Captured via Vanilla JS Frontend.

**2.** **Router:** FastAPI determines intent (SQL vs. Chat vs. Code).

**3.** **Context Injection:**

   **+ Memory:** Fetches last 10 messages from SQL Server.
 
   **+ Schema:** Queries live DB metadata.
 
  **+ Docs:** Queries ChromaDB vector store.


**4.** **Inference:** Ollama processes the prompt + context.

**5.** **Execution (Optional):** If SQL is generated, the "Run Query" button becomes active.

## Development
```bash
# Install development tools
pip install pytest black flake8

# Run DB Initialization manually
python -c "from app.db import init_db; init_db()"
```

## Project Structure
```bash
de-ai-assistant/
├── app/
│   ├── api/          # FastAPI Routes & Logic
│   ├── db.py         # SQL Server & Schema Logic
│   ├── llm/          # Ollama Integration
│   └── web/          # Frontend (HTML/JS/CSS)
├── data/             # Vector Store (ChromaDB)
├── .env              # Configuration
└── main.py           # Entry point
```

## Security Guardrails
```bash
Guardrail,Implementation
SQL Safety,"Regex blocks on DROP, DELETE, UPDATE, ALTER."
Prompt Injection,"System prompts enforce strict ""Data Engineering Scope""."
Output Sanitization,HTML escaping prevents XSS in the frontend.
```


<div align="center"> <sub>Développé par <b>Wassim Elmoufakkir</b></sub> </div>





