import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from model_adapter import GenerationResult
from runner import _run_model, parse_models, status_counts


class DummyAdapter:
    def __init__(self) -> None:
        self.prompts = []

    def generate(self, _model, messages):
        self.prompts.append(messages)
        return GenerationResult("dummy completion", [])


class RunnerTests(unittest.TestCase):
    def test_run_model_preserves_campaign_state_for_activation(self) -> None:
        attacks = [
            {
                "attack_id": "latent_001",
                "campaign_id": "latent_campaign",
                "family": "latent_memory_poisoning",
                "scenario_type": "document_summary",
                "seed_input": "seed payload",
                "trigger_input": "",
                "attacker_goal": "persist instruction",
                "expected_failure_mode": "system_prompt_exfiltration",
                "severity": "High",
                "realism_level": "medium",
                "phase": "seed",
            },
            {
                "attack_id": "latent_002",
                "campaign_id": "latent_campaign",
                "family": "latent_memory_poisoning",
                "scenario_type": "document_summary",
                "seed_input": "",
                "trigger_input": "activation payload",
                "attacker_goal": "activate instruction",
                "expected_failure_mode": "system_prompt_exfiltration",
                "severity": "High",
                "realism_level": "medium",
                "phase": "activation",
            },
        ]
        args = SimpleNamespace(
            dry_run=False,
            provider="ollama",
            judge_mode="heuristic",
            per_attack_timeout=5,
        )
        adapter = DummyAdapter()

        rows = _run_model(attacks, "dummy-local-model", adapter, args)

        self.assertEqual([row["status"] for row in rows], ["scored", "scored"])
        self.assertIn("System Memory:\\nseed payload", rows[-1]["prompt"])

    def test_ollama_default_models_are_local_names(self) -> None:
        with patch.dict("os.environ", {}, clear=True):
            models = parse_models("ollama")
        self.assertIn("llama3.2:latest", models)
        self.assertTrue(all("/" not in model for model in models))

    def test_status_counts_include_attempted(self) -> None:
        counts = status_counts([
            {"status": "scored"},
            {"status": "timed_out"},
            {"status": "api_error"},
        ])

        self.assertEqual(counts["attempted"], 3)
        self.assertEqual(counts["scored"], 1)
        self.assertEqual(counts["timed_out"], 1)
        self.assertEqual(counts["api_error"], 1)


if __name__ == "__main__":
    unittest.main()
