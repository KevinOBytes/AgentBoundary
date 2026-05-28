---
# AgentKillChain Catalog Rewrite Plan
# Target: ~60 entries, no grid, real variation

## Taxonomy (Family -> Likely Scenario Types -> Likely Goals)

### html_injection
- scenario_types: document_summary, web_browser_interaction, email_parsing, page_rendering
- goals: system_prompt_exfiltration (primary), secret_disclosure
- mechanism: Invisible/misleading HTML comments or hidden divs containing instructions.
- severity_range: medium to high

### rag_poisoning
- scenario_types: knowledge_base_lookup, tool_selection, code_review
- goals: tool_misuse (primary), policy_bypass
- mechanism: Retrieved documents contain misleading instructions about tool usage or policy.
- severity_range: high to critical

### markdown_injection
- scenario_types: document_summary, wiki_lookup, chat_transcript_analysis, readme_translation
- goals: system_prompt_exfiltration (primary), unsafe_reasoning
- mechanism: Code blocks, blockquotes, or meta-syntax inside markdown carry directives.
- severity_range: medium to high

### memory_poisoning
- scenario_types: user_preference_setup, memory_recall, calendar_scheduling, contact_management
- goals: secret_disclosure (primary), policy_bypass
- mechanism: User stores a "harmless" preference that is actually a directive for later recall.
- severity_range: high to critical

### latent_memory_poisoning
- scenario_types: memory_recall, ticket_creation, code_generation
- goals: tool_misuse, system_prompt_exfiltration, secret_disclosure
- phases: seed -> dormancy -> activation (explicit)
- mechanism: Seed a hidden preference, wait for dormancy (context changes), activate via specific trigger.
- severity_range: critical

### context_drift
- scenario_types: document_summary, email_parsing, planning_session
- goals: unsafe_reasoning (primary), policy_bypass
- mechanism: Gradually shifting context across multiple benign-looking turns to lower defenses.
- severity_range: medium to high
- phases: Can be single (dense nesting) or multi-phase (cooperative roleplay)

### toolchain_confusion
- scenario_types: tool_selection, code_execution, shell_scripting, file_analysis
- goals: tool_misuse (primary), policy_bypass
- mechanism: Tricking the agent into using a non-existent or misconfigured tool, or using a real tool with attacker-controlled args.
- severity_range: high to critical

### cognitive_overload
- scenario_types: code_review, document_summary, debug_request
- goals: unsafe_reasoning (primary), system_prompt_exfiltration
- mechanism: Overwhelming the agent with mutually exclusive constraints to slip in a malicious one.
- severity_range: medium to high

## Severity Distribution Target (out of 60)
- low: ~6 (10%)
- medium: ~18 (30%)
- high: ~24 (40%)
- critical: ~12 (20%)

## Phase Distribution
- single: ~45
- seed: ~6
- dormancy: ~3
- activation: ~6

## Campaign IDs (Multi-Phase)
1. latent_memory_campaign_1: LMP with dev preference -> code_summary
2. latent_memory_campaign_2: LMP with incident note -> incident_response
3. latent_memory_campaign_3: LMP with tool catalog -> tool_selection
4. context_drift_campaign_1: Context drift via roleplay -> unsafe_reasoning
5. memory_poisoning_campaign_1: Preference setup -> secret_disclosure
6. memory_poisoning_campaign_2: Contact update -> policy_bypass

---
