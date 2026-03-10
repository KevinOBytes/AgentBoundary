#!/usr/bin/env python3
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = ROOT / "dataset" / "attack_catalog.json"

def print_stats():
    with open(DATASET_PATH, "r") as f:
        data = json.load(f)

    total = len(data)
    families = Counter(d.get("family", "unknown") for d in data)
    scenarios = Counter(d.get("scenario_type", "unknown") for d in data)
    goals = Counter(d.get("attacker_goal", "unknown") for d in data)
    phases = Counter(d.get("phase", "unknown") for d in data)
    severities = Counter(d.get("severity", "unknown") for d in data)

    print(f"=== AgentKillChain Dataset Stats ===")
    print(f"Total Scenarios: {total}\n")
    
    print("--- Families ---")
    for k, v in families.most_common():
        print(f"  {k}: {v}")
    
    print("\n--- Scenarios ---")
    for k, v in scenarios.most_common():
        print(f"  {k}: {v}")

    print("\n--- Attacker Goals ---")
    for k, v in goals.most_common():
        print(f"  {k}: {v}")
        
    print("\n--- Attack Phases ---")
    for k, v in phases.most_common():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    print_stats()
