#!/usr/bin/env python3
"""Compatibility entry point for the current offline report generator.

The old dashboard generator mixed cohorts and hard-coded 500 evaluations. The
website now reads results/reconciled_stats.json. Historical result files are not
rewritten by this command; use --check to verify the report and paper tables.
"""
from scripts.analyze import main


if __name__ == "__main__":
    raise SystemExit(main())
