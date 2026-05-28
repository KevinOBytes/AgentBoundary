import unittest

from scripts.merge_result_rerun import merge_payloads


def result(model: str, attack_id: str, status: str, unsafe: bool = False) -> dict:
    return {
        "model": model,
        "attack_id": attack_id,
        "campaign_id": attack_id,
        "family": "html_injection",
        "phase": "single",
        "scenario_type": "document_summary",
        "status": status,
        "error_type": None if status == "scored" else "APIError",
        "prompt": "",
        "output": "",
        "flags": {
            "refusal_detected": False,
            "unsafe_instruction_adopted": unsafe,
            "unsafe_tool_call_proposed": False,
            "secret_disclosure_claimed": False,
            "policy_violation": False,
        },
    }


class MergeResultRerunTests(unittest.TestCase):
    def test_merge_replaces_matching_evaluation_and_recomputes_metrics(self) -> None:
        base_payload = {
            "metadata": {"run_label": "baseline"},
            "results": [
                result("model-a", "attack-1", "api_error"),
                result("model-a", "attack-2", "scored"),
            ],
        }
        rerun_payload = {
            "metadata": {"run_label": "rerun"},
            "results": [result("model-a", "attack-1", "scored", unsafe=True)],
        }

        merged = merge_payloads(base_payload, rerun_payload)

        self.assertEqual(merged["metadata"]["scored_count"], 2)
        self.assertEqual(merged["metadata"]["error_count"], 0)
        self.assertEqual(merged["metrics"]["scored_count"], 2)
        self.assertEqual(merged["metrics"]["api_error_count"], 0)
        self.assertEqual(merged["metrics"]["overall_vulnerability_score"], 0.5)
        self.assertEqual(merged["metadata"]["rerun_source_label"], "rerun")

    def test_merge_preserves_baseline_provider_and_cohort_label(self) -> None:
        base = result("model-a", "attack-1", "api_error")
        base["provider"] = "ollama-cloud"
        base["cohort_label"] = "ollama-cloud-baseline"
        rerun = result("model-a", "attack-1", "scored", unsafe=True)
        rerun["provider"] = "ollama-cloud"
        rerun["cohort_label"] = "lmp-vector-rerun"

        merged = merge_payloads(
            {"metadata": {"run_label": "baseline"}, "results": [base]},
            {"metadata": {"run_label": "rerun"}, "results": [rerun]},
        )

        self.assertEqual(merged["results"][0]["cohort_label"], "ollama-cloud-baseline")
        self.assertEqual(merged["results"][0]["provider"], "ollama-cloud")

    def test_merge_strips_rerun_cohort_label_when_baseline_has_none(self) -> None:
        rerun = result("model-a", "attack-1", "scored", unsafe=True)
        rerun["provider"] = "ollama-cloud"
        rerun["cohort_label"] = "lmp-vector-rerun"

        merged = merge_payloads(
            {"metadata": {"run_label": "baseline"}, "results": [result("model-a", "attack-1", "api_error")]},
            {"metadata": {"run_label": "rerun"}, "results": [rerun]},
        )

        self.assertNotIn("cohort_label", merged["results"][0])
        self.assertNotIn("provider", merged["results"][0])

    def test_merge_rejects_unknown_evaluation_key(self) -> None:
        with self.assertRaisesRegex(ValueError, "does not match"):
            merge_payloads(
                {"metadata": {}, "results": [result("model-a", "attack-1", "scored")]},
                {"metadata": {}, "results": [result("model-b", "attack-1", "scored")]},
            )


if __name__ == "__main__":
    unittest.main()
