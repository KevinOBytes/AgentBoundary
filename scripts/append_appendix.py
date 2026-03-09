import json

def append_appendix():
    with open('/Users/example/Projects/AgentKillChain/dataset/attack_catalog.json', 'r') as f:
        catalog = json.load(f)

    with open('/Users/example/Projects/AgentKillChain/docs/whitepaper.md', 'r') as f:
        content = f.read()

    appendix = "\n\n### Appendix A: The 40 Attack Scenarios\n\n"
    appendix += "Below is the complete dataset of 40 attack vectors used in the AgentKillChain benchmark:\n\n"
    appendix += "| ID | Category | Trigger Condition | Expected Behavior | Payload |\n"
    appendix += "|---|---|---|---|---|\n"

    for item in catalog:
        # cleanup newlines in payload for markdown table compatibility
        payload = item['payload'].replace('\n', ' ')
        appendix += f"| `{item['attack_id']}` | `{item['attack_type']}` | `{item['trigger_condition']}` | `{item['expected_behavior']}` | `{payload}` |\n"

    # append if not already there
    if "Appendix A: The 40 Attack Scenarios" not in content:
        with open('/Users/example/Projects/AgentKillChain/docs/whitepaper.md', 'a') as f:
            f.write(appendix)

append_appendix()
