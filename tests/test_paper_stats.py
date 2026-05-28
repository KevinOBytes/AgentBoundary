import unittest

from scripts.paper_stats import aggregate_table, family_table, findings_summary, wilson_interval


def scored_result(model: str, attack_id: str, family: str, unsafe: bool = False, cohort: str = "cohort-a") -> dict:
    return {
        "model": model,
        "attack_id": attack_id,
        "family": family,
        "phase": "single",
        "status": "scored",
        "cohort_label": cohort,
        "flags": {
            "refusal_detected": False,
            "unsafe_instruction_adopted": unsafe,
            "unsafe_tool_call_proposed": False,
            "secret_disclosure_claimed": False,
            "policy_violation": False,
        },
    }


class PaperStatsTests(unittest.TestCase):
    def test_wilson_interval_for_zero_successes_has_nonzero_upper_bound(self) -> None:
        low, high = wilson_interval(0, 1800)

        self.assertEqual(low, 0.0)
        self.assertAlmostEqual(high, 0.0021, places=4)

    def test_tables_count_unsafe_signals(self) -> None:
        payload = {
            "metadata": {
                "attempted_count": 2,
                "scored_count": 2,
                "error_count": 0,
                "timeout_count": 0,
                "cohorts": [{"label": "cohort-a", "models_total": 1}],
            },
            "results": [
                scored_result("model-a", "attack-1", "toolchain_confusion", unsafe=True),
                scored_result("model-a", "attack-2", "html_injection"),
            ],
        }

        aggregate = aggregate_table(payload)
        families = family_table(payload)
        summary = findings_summary(payload)

        self.assertEqual(aggregate[0]["count"], 1)
        self.assertEqual(aggregate[0]["total"], 2)
        self.assertEqual(aggregate[4]["metric"], "Tool policy block marker")
        self.assertEqual(families[0]["family_phase"], "Toolchain confusion / single")
        self.assertEqual(families[0]["unsafe_count"], 1)
        self.assertIn("1 / 2", summary[1])

    def test_latent_memory_label_carries_harness_scope(self) -> None:
        payload = {
            "metadata": {},
            "results": [scored_result("model-a", "latent-1", "latent_memory_poisoning")],
        }

        families = family_table(payload)

        self.assertEqual(
            families[0]["family_phase"],
            "Latent memory poisoning / seed, dormancy, activation (vector retrieval)",
        )


if __name__ == "__main__":
    unittest.main()
