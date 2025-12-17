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

<img width="1902" height="912" alt="dataais" src="https://github.com/user-attachments/assets/44b8d58d-2347-41e0-8269-8107d67a0bb9" />



</div>

## 📋 Requirements

- **Python:** 3.10 or higher
- **Database:** Microsoft SQL Server (Local or Azure)
- **LLM Engine:** Ollama (running `qwen2.5` or `llama3`)
- **Driver:** ODBC Driver 17 for SQL Server
- **Vector Store:** ChromaDB (Embedded)

## ⚡ Capabilities Matrix

| Feature | Description | Status |
| :--- | :--- | :---: |
| **Schema Awareness** | Reads `sys.tables` to understand your specific DB structure | ✅ |
| **Autonomous Agent** | Can safely execute read-only SQL queries via UI | ✅ |
| **RAG System** | Retrieves context from internal runbooks/docs | ✅ |
| **Streaming** | Real-time token generation (ChatGPT-style) | ✅ |
| **Memory** | Persists conversation history in SQL Server | ✅ |
| **Privacy** | 100% Local inference (No data leaves your network) | ✅ |

## 🚀 Installation

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


## 💻 Usage
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

## 🏗️ Architecture
### The system follows a modern **Agentic RAG** architecture:

**1.** **User Input:** Captured via Vanilla JS Frontend.

**2.** **Router:** FastAPI determines intent (SQL vs. Chat vs. Code).

**3.** **Context Injection:**

   **+ Memory:** Fetches last 10 messages from SQL Server.
 
   **+ Schema:** Queries live DB metadata.
 
  **+ Docs:** Queries ChromaDB vector store.


**4.** **Inference:** Ollama processes the prompt + context.

**5.** **Execution (Optional):** If SQL is generated, the "Run Query" button becomes active.

## 🛠️ Development
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

## 🔒 Security Guardrails
```bash
Guardrail,Implementation
SQL Safety,"Regex blocks on DROP, DELETE, UPDATE, ALTER."
Prompt Injection,"System prompts enforce strict ""Data Engineering Scope""."
Output Sanitization,HTML escaping prevents XSS in the frontend.
```

<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="256" height="256" rx="60" fill="#4353FF"/>
<path d="M169.105 103.436C169.105 103.436 155.29 146.718 154.269 150.393C153.861 146.786 143.789 69 143.789 69C120.242 69 107.72 85.7414 101.05 103.436C101.05 103.436 84.241 146.854 82.8799 150.461C82.8119 147.058 80.2938 103.844 80.2938 103.844C78.8647 82.1345 59.0609 69 43 69L62.3275 186.802C86.9632 186.734 100.234 170.061 107.175 152.299C107.175 152.299 121.943 113.984 122.556 112.283C122.692 113.916 133.172 186.802 133.172 186.802C157.876 186.802 171.215 171.218 178.36 154.136L213 69C188.568 69 175.706 85.6733 169.105 103.436Z" fill="white"/>
</svg> 

## Author: 
**Wassim Elmoufakkir** *junior Data Engineer for AI*

