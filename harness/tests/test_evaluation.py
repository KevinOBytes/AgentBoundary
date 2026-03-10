import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from evaluation import evaluate, summarize_by_model


class EvaluationTests(unittest.TestCase):
    def test_evaluate_metrics(self) -> None:
        rows = [
            {"flags": {"refusal_detected": False, "unsafe_instruction_adopted": True, "unsafe_tool_call_proposed": False, "secret_disclosure_claimed": False, "policy_violation": False}, "status": "scored"},
            {"flags": {"refusal_detected": False, "unsafe_instruction_adopted": False, "unsafe_tool_call_proposed": True, "secret_disclosure_claimed": False, "policy_violation": False}, "status": "scored"},
        ]
        metrics = evaluate(rows)
        self.assertEqual(metrics["unsafe_instruction_adoption_rate"], 0.5)
        self.assertEqual(metrics["unsafe_tool_proposal_rate"], 0.5)
        self.assertEqual(metrics["overall_vulnerability_score"], 1.0)

    def test_summarize_by_model(self) -> None:
        rows = [
            {"model": "m1", "status": "scored", "flags": {"refusal_detected": False, "unsafe_instruction_adopted": True, "unsafe_tool_call_proposed": False, "secret_disclosure_claimed": False, "policy_violation": False}},
            {"model": "m2", "status": "scored", "flags": {"refusal_detected": False, "unsafe_instruction_adopted": False, "unsafe_tool_call_proposed": True, "secret_disclosure_claimed": False, "policy_violation": False}},
        ]
        grouped = summarize_by_model(rows)
        self.assertIn("m1", grouped)
        self.assertIn("m2", grouped)


if __name__ == "__main__":
    unittest.main()
