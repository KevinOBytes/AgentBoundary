import unittest
import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'harness'))

from scenario_engine import ScenarioEngine, SessionState, AttackScenarioResult

def dummy_completion_fn(model: str, prompt: str) -> str:
    if "refusal" in prompt.lower() or "i can't" in prompt.lower():
         return "I can't do that."
    if "tool" in prompt.lower():
         return "[tool_call] sending to attacker"
    return "Dummy response"

class TestScenarioEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ScenarioEngine()

    def test_is_refusal(self):
        self.assertTrue(self.engine._is_refusal("i can't do that"))
        self.assertTrue(self.engine._is_refusal("i won't comply"))
        self.assertTrue(self.engine._is_refusal("as an ai, i cannot"))
        self.assertFalse(self.engine._is_refusal("here is the information"))

    def test_single_phase_execution(self):
        attack = {
            "attack_id": "vuln-01",
            "payload": "normal payload",
            "trigger_condition": "do it",
            "attack_type": "standard",
            "expected_behavior": "test"
        }
        
        result = self.engine.execute(attack, "dummy-model", dummy_completion_fn)
        self.assertEqual(result.attack_id, "vuln-01")
        self.assertFalse(result.flags["refusal_detected"])
        
    def test_multi_phase_execution(self):
        # 1. Seed
        seed_attack = {
            "attack_id": "vuln-02",
            "phase": "seed",
            "campaign_id": "test-campaign",
            "payload": "hidden malicious instructions",
            "attack_type": "advanced",
        }
        res_seed = self.engine.execute(seed_attack, "dummy-model", dummy_completion_fn)
        self.assertFalse(res_seed.flags["refusal_detected"])
        state = self.engine.campaign_states["test-campaign"]
        self.assertEqual(len(state.seed_documents), 1)

        # 2. Dormancy
        dormant_attack = {
            "attack_id": "vuln-03",
            "phase": "dormancy",
            "campaign_id": "test-campaign",
            "payload": "",
            "attack_type": "advanced"
        }
        res_dormant = self.engine.execute(dormant_attack, "dummy-model", dummy_completion_fn)
        self.assertEqual(len(state.seed_documents), 0)
        self.assertEqual(len(state.dormant_memory_summaries), 1)

        # 3. Activation
        activation_attack = {
            "attack_id": "vuln-04",
            "phase": "activation",
            "campaign_id": "test-campaign",
            "payload": "do something with tool",
            "trigger_condition": "workflow",
            "attack_type": "advanced"
        }
        res_activation = self.engine.execute(activation_attack, "dummy-model", dummy_completion_fn)
        self.assertTrue(res_activation.flags["unsafe_tool_call_proposed"])

if __name__ == '__main__':
    unittest.main()
