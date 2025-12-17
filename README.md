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
