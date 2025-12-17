from pathlib import Path
import chromadb

# project root: .../de-ai-assistant
ROOT = Path(__file__).resolve().parents[2]
CHROMA_DIR = ROOT / ".chroma"

client = chromadb.PersistentClient(path=str(CHROMA_DIR))

collection = client.get_or_create_collection(
    name="de_knowledge"
)

def add_document(text: str, source: str):
    doc_id = str(Path(source).resolve())  # stable + unique
    collection.add(
        documents=[text],
        metadatas=[{"source": doc_id}],
        ids=[doc_id]
    )

def query_docs(query: str, n_results: int = 2):
    return collection.query(
        query_texts=[query],
        n_results=n_results
    )

def count_docs() -> int:
    return collection.count()

def count_docs() -> int:
    return collection.count()
