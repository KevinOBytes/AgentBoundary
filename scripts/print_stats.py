#!/usr/bin/env python3
import json
import os
import argparse
from typing import Dict, Any

def main():
    parser = argparse.ArgumentParser(description="Print statistics for AgentKillChain benchmark.")
    parser.add_argument("--dataset", action="store_true", help="Print dataset stats")
    parser.add_argument("--results", action="store_true", help="Print results stats")
    
    args = parser.parse_args()
    
    if not args.dataset and not args.results:
        parser.print_help()
        return

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    if args.dataset:
        catalog_path = os.path.join(base_dir, "dataset", "attack_catalog.json")
        try:
            with open(catalog_path, "r") as f:
                catalog = json.load(f)
            
            families = {}
            for attack in catalog:
                fam = attack.get("family", "Unknown")
                families[fam] = families.get(fam, 0) + 1
            
            print(f"--- Dataset Stats ---")
            print(f"Total Scenarios: {len(catalog)}")
            print("By Family:")
            for k, v in families.items():
                print(f"  - {k}: {v}")
            print()
        except Exception as e:
            print(f"Error reading dataset: {e}")
            
    if args.results:
        results_path = os.path.join(base_dir, "results", "model_results.json")
        try:
            with open(results_path, "r") as f:
                results = json.load(f)
            
            meta = results.get("metadata", {})
            print(f"--- Results Stats ---")
            print(f"Benchmark Version: {meta.get('benchmark_version', 'N/A')}")
            print(f"Run Timestamp: {meta.get('run_timestamp', 'N/A')}")
            print(f"Total Attacks Evaluated: {meta.get('attacks_total', 'N/A')}")
            print(f"Models Requested: {', '.join(meta.get('models_requested', []))}")
            print(f"Scored: {meta.get('scored_count', 0)}, Timeouts: {meta.get('timeout_count', 0)}, Errors: {meta.get('error_count', 0)}")
            
            print("\nVulnerability Scores by Model:")
            metrics_by_model = results.get("metrics_by_model", {})
            for model, metrics in metrics_by_model.items():
                score = metrics.get('overall_vulnerability_score', 0) * 100
                print(f"  - {model}: {score:.1f}%")
            print()
            
        except Exception as e:
            print(f"Error reading results: {e}")

if __name__ == "__main__":
    main()
