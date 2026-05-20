from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def load_tests(loader: unittest.TestLoader, _tests: unittest.TestSuite, _pattern: str) -> unittest.TestSuite:
    suite = unittest.TestSuite()
    suite.addTests(loader.discover(str(ROOT / "tests"), pattern="test*.py"))
    suite.addTests(loader.discover(str(ROOT / "harness" / "tests"), pattern="test*.py"))
    return suite
