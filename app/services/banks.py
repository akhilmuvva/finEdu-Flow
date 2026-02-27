import httpx
import requests  # sync fallback
from decimal import Decimal
from typing import List, Dict, Any
import os

# Geoapify Places API Key
GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY", "dc1406c2dc6a4b0f829b82e728371638")

# 2026 Interest Rate Tiers (Policy-compliant)
RATE_TIERS = {
    "AAA": 8.0,
    "AA":  8.2,
    "A":   9.5,
}

# Bank name keyword → preferred tier boost (branding heuristic)
PRIORITY_BANKS = {
    "SBI": "AAA", "HDFC": "AAA", "ICICI": "AA",
    "AXIS": "AA", "BOB": "A", "PNB": "A", "CANARA": "A"
}


def fetch_nearby_banks_sync(lat: float, lon: float) -> list:
    """
    Fetch nearby bank branches using Geoapify Places API.
    Category: service.financial — works on free plan, returns real banks + ATMs.
    filter=circle + bias=proximity per the 2026 specification.
    """
    url = (
        f"https://api.geoapify.com/v2/places?"
        f"categories=service.financial&"
        f"filter=circle:{lon},{lat},5000&"
        f"bias=proximity:{lon},{lat}&"
        f"limit=10&apiKey={GEOAPIFY_API_KEY}"
    )
    try:
        response = requests.get(url, timeout=6)
        if response.status_code == 200:
            all_features = response.json().get("features", [])
            # Prefer full bank branches over pure ATMs
            bank_keywords = ["bank", "sbi", "hdfc", "icici", "axis", "pnb", "bob",
                             "canara", "union", "kotak", "idbi", "federal", "rbl",
                             "bandhan", "citibank", "standard chartered", "hsbc"]
            banks = [
                f for f in all_features
                if any(kw in (f.get("properties", {}).get("name") or "").lower()
                       for kw in bank_keywords)
            ]
            return banks[:5] if banks else all_features[:5]
    except Exception as e:
        print(f"[BankNavigator Sync] Error: {e}")
    return []


class BankNavigator:
    """
    Intelligent Fulfillment Layer — 2026 Edition
    Uses Geoapify 'amenity.bank' + proximity bias + circle filter.
    Tags each branch with 2026 Interest Rate Tier (AAA/AA/A) and
    PM-Vidyalaxmi subvention eligibility.
    """

    _cache: Dict[str, List[Dict[str, Any]]] = {}

    @staticmethod
    def _detect_tier(name: str, university_category: str) -> str:
        """Detect rate tier from bank name heuristic, fallback to university category."""
        name_upper = (name or "").upper()
        for keyword, tier in PRIORITY_BANKS.items():
            if keyword in name_upper:
                return tier
        return university_category or "A"

    @staticmethod
    async def get_nearby_fulfillment(
        lat: float,
        lon: float,
        family_income: Decimal,
        university_category: str
    ) -> List[Dict[str, Any]]:
        
        cache_key = f"{lat:.4f}_{lon:.4f}_{university_category}"
        if cache_key in BankNavigator._cache:
            return BankNavigator._cache[cache_key]

        # URL: service.financial + circle filter + proximity bias (2026 spec)
        url = (
            f"https://api.geoapify.com/v2/places?"
            f"categories=service.financial&"
            f"filter=circle:{lon},{lat},5000&"
            f"bias=proximity:{lon},{lat}&"
            f"limit=10&apiKey={GEOAPIFY_API_KEY}"
        )

        features = []
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    features = response.json().get("features", [])
                else:
                    print(f"[BankNavigator] Geoapify returned {response.status_code}")
        except Exception as e:
            print(f"[BankNavigator] Async fetch error: {e}")

        if not features:
            return []

        # Filter to actual banks by name keyword
        bank_keywords = ["bank", "sbi", "hdfc", "icici", "axis", "pnb", "bob",
                         "canara", "union", "kotak", "yes bank", "idbi", "federal"]
        bank_features = [
            f for f in features
            if any(kw in (f.get("properties", {}).get("name") or "").lower()
                   for kw in bank_keywords)
        ]
        features = bank_features[:5] if bank_features else features[:5]

        # PM-Vidyalaxmi: eligible if family income ≤ ₹8L/year
        pmvl_eligible = family_income <= Decimal("800000")

        results = []
        for feat in features:
            props = feat.get("properties", {})
            geo   = feat.get("geometry", {}).get("coordinates", [lon, lat])

            name     = props.get("name") or props.get("brand") or "Scheduled Bank Branch"
            distance = props.get("distance", 0)
            address  = props.get("formatted") or props.get("address_line1") or "Branch Address"

            # Determine rate tier — per-bank heuristic, fallback to university tier
            tier = BankNavigator._detect_tier(name, university_category)
            interest_rate = RATE_TIERS.get(tier, 9.8)

            results.append({
                "name":              name,
                "distance_meters":   round(distance),
                "formatted_address": address,
                "lat":               geo[1],
                "lon":               geo[0],
                "tier":              tier,
                "interest_rate_2026":interest_rate,
                "pmvl_prioritized":  pmvl_eligible,
                # Direct Google Maps link
                "maps_url": (
                    f"https://www.google.com/maps/search/?api=1"
                    f"&query={geo[1]},{geo[0]}"
                    f"&query_place_id={props.get('place_id', '')}"
                ),
                # Document checklist for this branch
                "document_checklist": [
                    {"doc": "Income Certificate",    "required": pmvl_eligible,  "priority": "HIGH" if pmvl_eligible else "NORMAL"},
                    {"doc": "NIRF Admission Letter", "required": True,            "priority": "HIGH"},
                    {"doc": "Co-applicant Aadhar",   "required": True,            "priority": "HIGH"},
                    {"doc": "Entrance Scorecard",    "required": True,            "priority": "MEDIUM"},
                    {"doc": "Fee Structure",         "required": True,            "priority": "MEDIUM"},
                ],
            })

        # Sort by distance (closest first — Geoapify bias already does this,
        # but we re-sort as a guarantee)
        results.sort(key=lambda x: x["distance_meters"])

        BankNavigator._cache[cache_key] = results
        return results
