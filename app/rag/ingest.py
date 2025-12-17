from pathlib import Path
from app.rag.vectorstore import add_document

ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "runbooks"

def main():
    print(f"[ingest] cwd = {Path.cwd()}")
    print(f"[ingest] docs = {DOCS_DIR} (exists={DOCS_DIR.exists()})")

    md_files = sorted(DOCS_DIR.glob("*.md"))
    print(f"[ingest] found {len(md_files)} .md files")

    for f in md_files:
        text = f.read_text(encoding="utf-8", errors="ignore")
        add_document(text=text, source=str(f))
        print(f"[ingest] added: {f.name}")

    print("[ingest] ✅ DE knowledge ingested")

if __name__ == "__main__":
    main()
