from .config import calculate_npk_index

def validate_and_normalize(reading_data: dict) -> dict:
    """
    Validates and normalizes reading parameters according to physical and agronomic boundaries.
    """
    normalized = dict(reading_data)

    # 1. pH validation: physical limits 0.0 - 14.0
    if normalized.get("ph") is not None:
        try:
            val = float(normalized["ph"])
            normalized["ph"] = round(max(0.0, min(14.0, val)), 2)
        except (ValueError, TypeError):
            normalized["ph"] = None

    # 2. Moisture % validation: 0.0 - 100.0%
    if normalized.get("moisture_pct") is not None:
        try:
            val = float(normalized["moisture_pct"])
            normalized["moisture_pct"] = round(max(0.0, min(100.0, val)), 1)
        except (ValueError, TypeError):
            normalized["moisture_pct"] = None

    # 3. Temperature °C validation: reasonable manure/ambient composting range -10.0 to 90.0°C
    if normalized.get("temperature_c") is not None:
        try:
            val = float(normalized["temperature_c"])
            normalized["temperature_c"] = round(max(-10.0, min(90.0, val)), 1)
        except (ValueError, TypeError):
            normalized["temperature_c"] = None

    # 4. Nutrients N, P, K in %: realistic manure range 0.0 - 20.0%
    for nut in ["nitrogen_pct", "phosphorus_pct", "potassium_pct"]:
        if normalized.get(nut) is not None:
            try:
                val = float(normalized[nut])
                normalized[nut] = round(max(0.0, min(20.0, val)), 3)
            except (ValueError, TypeError):
                normalized[nut] = None

    # 5. Organic Carbon % (manual/lab-entered): 0.0 - 100.0%
    if normalized.get("organic_carbon_pct") is not None:
        try:
            val = float(normalized["organic_carbon_pct"])
            normalized["organic_carbon_pct"] = round(max(0.0, min(100.0, val)), 2)
        except (ValueError, TypeError):
            normalized["organic_carbon_pct"] = None

    # 6. Calculate NPK index if N, P, K are present
    n = normalized.get("nitrogen_pct")
    p = normalized.get("phosphorus_pct")
    k = normalized.get("potassium_pct")
    if n is not None and p is not None and k is not None:
        normalized["npk_index"] = calculate_npk_index(n, p, k)
    elif normalized.get("npk_index") is None:
        normalized["npk_index"] = None

    return normalized
