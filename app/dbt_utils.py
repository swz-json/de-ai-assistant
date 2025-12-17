import json
from pathlib import Path

# Config: path to the dbt manifest file
# We look for 'dbt_data' in the project root
DBT_MANIFEST_PATH = Path(__file__).resolve().parents[2] / "dbt_data" / "manifest.json"

def get_dbt_context():
    """
    Reads dbt manifest.json and returns a summary of models.
    """
    if not DBT_MANIFEST_PATH.exists():
        return "(dbt manifest not found. Using SQL context only.)"

    try:
        with open(DBT_MANIFEST_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        nodes = data.get("nodes", {})
        context_str = "CURRENT DBT PROJECT MODELS:\n"
        
        count = 0
        for key, node in nodes.items():
            if node["resource_type"] == "model":
                name = node["name"]
                desc = node["description"] or "No description."
                
                # Get dependencies
                depends_on = node.get("depends_on", {}).get("nodes", [])
                parents = [p.split('.')[-1] for p in depends_on]
                parents_str = ", ".join(parents) if parents else "None"
                
                context_str += f"- Model: {name}\n  Desc: {desc}\n  Parents: {parents_str}\n"
                count += 1
                if count >= 50: break
                
        return context_str

    except Exception as e:
        return f"(Error reading dbt manifest: {e})"

if __name__ == "__main__":
    print(get_dbt_context())
