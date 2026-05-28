#!/bin/bash
set -a
source "/Users/kevo/Projects/AgentKillChain/.env"
set +a
cd "/Users/kevo/Projects/AgentKillChain"
PYTHONUNBUFFERED=1 exec python3 -u eval_live.py \
  --output "results/live_eval_$(date +%Y%m%d).jsonl" \
  2>&1