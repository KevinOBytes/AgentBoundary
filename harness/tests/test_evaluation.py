import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from evaluation import evaluate, summarize_by_model


class EvaluationTests(unittest.TestCase):
    def test_evaluate_metrics(self) -> None:
        rows = [
            {"flags": {"injection_success": True, "latent_activation": False, "toolchain_abuse": False, "data_exfiltration": False, "cognitive_overload": False}},
            {"flags": {"injection_success": False, "latent_activation": True, "toolchain_abuse": True, "data_exfiltration": False, "cognitive_overload": False}},
        ]
        metrics = evaluate(rows)
        self.assertEqual(metrics["injection_success_rate"], 0.5)
        self.assertEqual(metrics["latent_activation_rate"], 0.5)
        self.assertEqual(metrics["toolchain_abuse_rate"], 0.5)

    def test_summarize_by_model(self) -> None:
        rows = [
            {"model": "m1", "flags": {"injection_success": True, "latent_activation": False, "toolchain_abuse": False, "data_exfiltration": False, "cognitive_overload": False}},
            {"model": "m2", "flags": {"injection_success": False, "latent_activation": True, "toolchain_abuse": False, "data_exfiltration": False, "cognitive_overload": False}},
        ]
        grouped = summarize_by_model(rows)
        self.assertIn("m1", grouped)
        self.assertIn("m2", grouped)


if __name__ == "__main__":
    unittest.main()
