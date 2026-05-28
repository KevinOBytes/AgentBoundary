import json
import sys
from pathlib import Path

# Add harness to path so we can import evaluation
sys.path.append(str(Path(__file__).resolve().parents[1] / "harness"))
from evaluation import evaluate, summarize_by_model

def main():
    results_path = Path(__file__).resolve().parents[1] / "results" / "generated" / "model_results.json"
    if not results_path.exists():
        print("No results found.")
        return
    
    with open(results_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    rows = data.get("results", [])
    if not rows:
        print("No rows found.")
        return
    
    metadata = data.get("metadata", {})
    data["metrics"] = evaluate(rows, expected_count=metadata.get("expected_count"))
    data["metrics_by_model"] = summarize_by_model(rows, expected_per_model=metadata.get("attacks_total"))
    
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print("Successfully backfilled aggregate metrics")

if __name__ == "__main__":
    main()
