import requests

lat, lon = 12.9716, 77.5946
api_key = "dc1406c2dc6a4b0f829b82e728371638"

for cat in ["service.financial", "service.financial.bank", "service.financial.atm"]:
    url = (
        f"https://api.geoapify.com/v2/places?"
        f"categories={cat}&"
        f"filter=circle:{lon},{lat},5000&"
        f"limit=3&"
        f"apiKey={api_key}"
    )
    r = requests.get(url, timeout=6)
    data = r.json()
    count = len(data.get("features", []))
    msg = data.get("message", "OK")[:80]
    print(f"{cat}: status={r.status_code} count={count} {msg}")
    if count > 0:
        for f in data["features"][:2]:
            print(f"  -> {f['properties'].get('name','?')} | {f['properties'].get('categories','?')}")
