import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scenario_engine import ScenarioEngine


class ScenarioEngineTests(unittest.TestCase):
    def test_latent_memory_activation_uses_seeded_memory(self) -> None:
        engine = ScenarioEngine()
        observed_prompts = []

        def completion(_model: str, prompt: str) -> str:
            observed_prompts.append(prompt)
            return "memory observed"

        engine.execute(
            {
                "attack_id": "a1",
                "campaign_id": "camp-x",
                "attack_type": "latent_memory_poisoning",
                "payload": "seed payload",
                "phase": "seed",
            },
            "test-model",
            completion,
        )
        engine.execute(
            {
                "attack_id": "a2",
                "campaign_id": "camp-x",
                "attack_type": "latent_memory_poisoning",
                "payload": "activation payload",
                "phase": "activation",
            },
            "test-model",
            completion,
        )

        self.assertIn("Memory: seed payload", observed_prompts[-1])


if __name__ == "__main__":
    unittest.main()
