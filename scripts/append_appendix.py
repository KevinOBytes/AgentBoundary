import json
from pathlib import Path

def append_appendix():
    root_dir = Path(__file__).resolve().parent.parent
    catalog_path = root_dir / 'dataset' / 'attack_catalog.json'
    whitepaper_path = root_dir / 'docs' / 'whitepaper.md'

    with open(catalog_path, 'r') as f:
        catalog = json.load(f)

    with open(whitepaper_path, 'r') as f:
        content = f.read()

    appendix = "\n\n### Appendix A: The 40 Attack Scenarios\n\n"
    appendix += "Below is the complete dataset of 40 attack vectors used in the AgentKillChain benchmark:\n\n"
    appendix += "| ID | Category | Trigger Condition | Expected Behavior | Payload |\n"
    appendix += "|---|---|---|---|---|\n"

    for item in catalog:
        # cleanup newlines in payload for markdown table compatibility
        payload = item.get('seed_input', '') + item.get('trigger_input', '')
        payload = payload.replace('\n', ' ')
        appendix += f"| `{item['attack_id']}` | `{item['family']}` | `{item['scenario_type']}` | `{item['attacker_goal']}` | `{payload}` |\n"

    # append if not already there
    if "Appendix A: The 40 Attack Scenarios" not in content:
        with open(whitepaper_path, 'a') as f:
            f.write(appendix)

append_appendix()
