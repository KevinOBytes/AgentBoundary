#!/usr/bin/env python3
"""Poll OpenAI batch job status and download results when complete.

Usage:
    export OPENAI_API_KEY=...
    python3 scripts/poll_batch.py batch_6a1fc45df4ac8190b97fdba3d486ce01
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.request
from pathlib import Path


def api_call(path: str, api_key: str) -> dict:
    req = urllib.request.Request(
        f"https://api.openai.com/v1/{path}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("batch_id")
    p.add_argument("--interval", type=int, default=60, help="Polling interval in seconds")
    p.add_argument("--download-dir", default="results", help="Directory to save results")
    args = p.parse_args()

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set")
        return 1

    repo = Path(__file__).resolve().parent.parent
    download_dir = repo / args.download_dir
    download_dir.mkdir(parents=True, exist_ok=True)

    print(f"Polling batch {args.batch_id} every {args.interval}s...")
    completed = False

    while True:
        batch = api_call(f"batches/{args.batch_id}", api_key)
        status = batch.get("status", "unknown")
        counts = batch.get("request_counts", {})
        usage = batch.get("usage", {})

        ts = time.strftime("%H:%M:%S")
        print(f"[{ts}] Status: {status} | Completed: {counts.get('completed', 0)}/{counts.get('total', 0)} | Failed: {counts.get('failed', 0)} | Tokens: {usage.get('total_tokens', 0):,}")

        if status in ("completed", "failed", "expired", "cancelled"):
            if status == "completed":
                completed = True
                out_file_id = batch.get("output_file_id")
                err_file_id = batch.get("error_file_id")

                if out_file_id:
                    out_path = download_dir / f"batch_{args.batch_id}_output.jsonl"
                    print(f"Downloading results to {out_path}...")
                    req = urllib.request.Request(
                        f"https://api.openai.com/v1/files/{out_file_id}/content",
                        headers={"Authorization": f"Bearer {api_key}"},
                    )
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        data = resp.read()
                    out_path.write_bytes(data)
                    print(f"Saved {len(data):,} bytes ({len(data)/(1024*1024):.2f} MB)")
                    print(f"\nNext: python3 scripts/process_batch_results.py {out_path}")
                else:
                    print("No output file_id present.")
                    out_path = None

                if err_file_id:
                    err_path = download_dir / f"batch_{args.batch_id}_errors.jsonl"
                    print(f"Downloading errors to {err_path}...")
                    req = urllib.request.Request(
                        f"https://api.openai.com/v1/files/{err_file_id}/content",
                        headers={"Authorization": f"Bearer {api_key}"},
                    )
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        data = resp.read()
                    err_path.write_bytes(data)
                    print(f"Saved {len(data):,} bytes")

                # Save metadata
                meta_path = download_dir / f"batch_{args.batch_id}_meta.json"
                with open(meta_path, "w") as f:
                    json.dump(batch, f, indent=2)
                print(f"Saved metadata to {meta_path}")

            else:
                print(f"Batch ended with status: {status}")
            break

        time.sleep(args.interval)

    return 0 if completed else 1


if __name__ == "__main__":
    raise SystemExit(main())
