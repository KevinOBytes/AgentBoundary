#!/bin/bash
set -a
source "/Users/example/Projects/AgentBoundary/.env"
set +a
cd "/Users/example/Projects/AgentBoundary"
PYTHONUNBUFFERED=1 exec python3 -u eval_live.py \
  --output "results/v2_2_eval_$(date +%Y%m%d).jsonl" \
  2>&1