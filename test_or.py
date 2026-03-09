import json, urllib.request, os
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    # load from .env
    for line in open(".env"):
        if line.startswith("OPENROUTER_API_KEY"):
            api_key = line.split("=", 1)[1].strip().strip('"')

def test_model(model):
    print(f"Testing {model}...")
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps({
            "model": model,
            "messages": [{"role": "user", "content": "Hello! Reply with exactly 'TEST_SUCCESS'."}]
        }).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
            print(f"Success: {data['choices'][0]['message']['content']}")
    except Exception as e:
        if hasattr(e, "read"):
            print(f"Failed! {e} - {e.read().decode('utf-8')}")
        else:
            print(f"Failed! {e}")

test_model("openai/gpt-4o")
test_model("openai/gpt-5.4-pro")
