import json, urllib.request, os
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    for line in open(".env"):
        if line.startswith("OPENROUTER_API_KEY"):
            api_key = line.split("=", 1)[1].strip().strip('"')

req = urllib.request.Request(
    "https://openrouter.ai/api/v1/chat/completions",
    data=json.dumps({"model": "openai/gpt-5.4-pro", "messages": [{"role": "user", "content": "Hi"}]}).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AgentKillChain"
    },
    method="POST"
)
try:
    with urllib.request.urlopen(req, timeout=10) as response:
        print(response.read().decode("utf-8"))
except Exception as e:
    if hasattr(e, "read"):
        print(f"Error HTTP: {e} - {e.read().decode('utf-8')}")
    else:
        print(f"Error: {e}")
