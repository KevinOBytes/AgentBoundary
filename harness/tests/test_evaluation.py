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
        self.assertEqual(metrics["tool_policy_block_rate"], 0.0)
        self.assertEqual(metrics["policy_violation_rate"], metrics["tool_policy_block_rate"])

    def test_evaluate_coverage_uses_expected_count(self) -> None:
        rows = [
            {"flags": {"refusal_detected": False, "unsafe_instruction_adopted": False, "unsafe_tool_call_proposed": False, "secret_disclosure_claimed": False, "policy_violation": True}, "status": "scored"},
            {"flags": {"refusal_detected": False, "unsafe_instruction_adopted": False, "unsafe_tool_call_proposed": False, "secret_disclosure_claimed": False, "policy_violation": False}, "status": "timed_out"},
        ]
        metrics = evaluate(rows, expected_count=4)
        self.assertEqual(metrics["expected_count"], 4)
        self.assertEqual(metrics["coverage_rate"], 0.25)
        self.assertEqual(metrics["tool_policy_block_rate"], 1.0)

    def test_summarize_by_model(self) -> None:
        rows = [
            {"model": "m1", "status": "scored", "flags": {"refusal_detected": False, "unsafe_instruction_adopted": True, "unsafe_tool_call_proposed": False, "secret_disclosure_claimed": False, "policy_violation": False}},
            {"model": "m2", "status": "scored", "flags": {"refusal_detected": False, "unsafe_instruction_adopted": False, "unsafe_tool_call_proposed": True, "secret_disclosure_claimed": False, "policy_violation": False}},
        ]
        grouped = summarize_by_model(rows, expected_per_model=2)
        self.assertIn("m1", grouped)
        self.assertIn("m2", grouped)
        self.assertEqual(grouped["m1"]["coverage_rate"], 0.5)


if __name__ == "__main__":
    unittest.main()
