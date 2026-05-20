import unittest

from scripts.combine_result_cohorts import combine_cohorts


def result(model: str, attack_id: str, status: str = "scored") -> dict:
    return {
        "model": model,
        "attack_id": attack_id,
        "campaign_id": attack_id,
        "family": "html_injection",
        "phase": "single",
        "scenario_type": "document_summary",
        "status": status,
        "error_type": None,
        "prompt": "",
        "output": "",
        "flags": {
            "refusal_detected": False,
            "unsafe_instruction_adopted": False,
            "unsafe_tool_call_proposed": False,
            "secret_disclosure_claimed": False,
            "policy_violation": False,
        },
    }


class CombineResultCohortsTests(unittest.TestCase):
    def test_combine_cohorts_adds_provider_metadata(self) -> None:
        ollama = {
            "metadata": {
                "run_label": "ollama-run",
                "models_requested": ["ollama-model"],
                "attacks_total": 1,
                "campaigns_total": 1,
            },
            "results": [result("ollama-model", "attack-1")],
        }
        openrouter = {
            "metadata": {
                "run_label": "openrouter-run",
                "models_requested": ["openai/model"],
                "attacks_total": 1,
                "campaigns_total": 1,
            },
            "results": [result("openai/model", "attack-1")],
        }

        combined = combine_cohorts([
            (ollama, "ollama-cloud", "ollama-cloud-baseline"),
            (openrouter, "openrouter", "openrouter-frontier"),
        ])

        self.assertEqual(combined["metadata"]["provider"], "multi-provider")
        self.assertEqual(combined["metadata"]["expected_count"], 2)
        self.assertEqual(combined["metadata"]["scored_count"], 2)
        self.assertEqual(combined["metadata"]["model_providers"]["ollama-model"], "ollama-cloud")
        self.assertEqual(combined["metadata"]["model_providers"]["openai/model"], "openrouter")
        self.assertEqual(combined["results"][0]["provider"], "ollama-cloud")
        self.assertEqual(combined["results"][1]["cohort_label"], "openrouter-frontier")


if __name__ == "__main__":
    unittest.main()
