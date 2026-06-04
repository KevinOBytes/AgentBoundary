#!/bin/bash
set -a
source "/Users/kevo/Projects/AgentBoundary/.env"
set +a
cd "/Users/kevo/Projects/AgentBoundary"
PYTHONUNBUFFERED=1 exec python3 -u eval_parallel.py \
  --output "results/v2_2_eval_20260528.jsonl" \
  2>&1 | tee results/parallel_run_$(date +%Y%m%d_%H%M%S).log
