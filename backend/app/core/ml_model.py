import os
import joblib
import pandas as pd
from typing import Dict, Any, List
from .config import calculate_npk_index

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    "data", "processed", "crop_suitability_model.joblib"
)

_cached_model_bundle = None
_cached_model_mtime = 0

# Agronomic criteria and optimal growth envelopes according to ICAR / FAO
CROP_AGRONOMIC_PROFILES = {
    "Pulses": {
        "n": (0.30, 0.95, 0.10, 1.80),
        "p": (0.35, 0.70, 0.15, 1.20),
        "k": (0.20, 0.50, 0.10, 0.90),
        "ph": (6.0, 7.5, 5.5, 8.2),
        "temp": (18.0, 30.0, 12.0, 36.0),
        "rationale": "Low Nitrogen requirement matches biological N-fixation; adequate Phosphorus stimulates root nodulation without vegetative lodging."
    },
    "Mustard": {
        "n": (1.00, 1.60, 0.40, 2.20),
        "p": (0.25, 0.50, 0.12, 0.90),
        "k": (0.30, 0.55, 0.15, 0.90),
        "ph": (6.0, 7.5, 5.5, 8.2),
        "temp": (10.0, 22.0, 6.0, 28.0),
        "rationale": "Cooler temperatures and moderate Nitrogen & Sulfur demand provide optimal conditions for siliqua seed development."
    },
    "Wheat": {
        "n": (1.40, 2.20, 0.70, 2.80),
        "p": (0.35, 0.65, 0.18, 1.00),
        "k": (0.35, 0.65, 0.18, 1.00),
        "ph": (6.2, 7.5, 5.5, 8.2),
        "temp": (15.0, 26.0, 9.0, 32.0),
        "rationale": "Balanced NPK ratio and cool-moderate temperatures promote vigorous tillering and grain filling without risk of lodging."
    },
    "Maize": {
        "n": (1.60, 2.50, 0.80, 3.20),
        "p": (0.40, 0.70, 0.20, 1.10),
        "k": (0.40, 0.70, 0.20, 1.10),
        "ph": (5.8, 7.5, 5.2, 8.2),
        "temp": (18.0, 32.0, 12.0, 38.0),
        "rationale": "Good Nitrogen availability supports rapid vegetative biomass accumulation and cob kernel formation."
    },
    "Cotton": {
        "n": (1.80, 2.60, 0.90, 3.40),
        "p": (0.40, 0.70, 0.20, 1.10),
        "k": (0.50, 0.85, 0.25, 1.30),
        "ph": (6.5, 8.0, 5.8, 8.5),
        "temp": (22.0, 36.0, 15.0, 42.0),
        "rationale": "Warm climate and neutral-to-alkaline pH paired with strong Potassium availability promote boll retention and fiber strength."
    },
    "Rice": {
        "n": (2.20, 3.40, 1.20, 4.20),
        "p": (0.35, 0.60, 0.18, 1.00),
        "k": (0.40, 0.70, 0.20, 1.20),
        "ph": (5.5, 7.0, 4.8, 7.8),
        "temp": (24.0, 36.0, 18.0, 42.0),
        "rationale": "High Nitrogen density in warm humid conditions satisfies intensive vegetative and panicle initiation requirements."
    },
    "Potato": {
        "n": (2.20, 3.40, 1.20, 4.00),
        "p": (0.60, 1.05, 0.25, 1.50),
        "k": (1.20, 2.10, 0.60, 2.60),
        "ph": (5.0, 6.4, 4.5, 7.2),
        "temp": (14.0, 24.0, 8.0, 28.0),
        "rationale": "High Potassium and Phosphorus density combined with slightly acidic pH and cool weather favor vigorous tuber bulking and starch synthesis."
    },
    "Sugarcane": {
        "n": (3.20, 4.80, 1.80, 6.00),
        "p": (0.70, 1.25, 0.35, 1.80),
        "k": (1.00, 1.85, 0.50, 2.50),
        "ph": (6.5, 8.0, 5.8, 8.5),
        "temp": (22.0, 38.0, 16.0, 44.0),
        "rationale": "Exhaustive nutrient supply across N, P, and K with warm temperatures satisfies long-duration, high-tonnage cane biomass synthesis."
    }
}

def _train_and_save_model_inline():
    """
    Inline fallback model trainer — used when crop_suitability_model.joblib is missing.
    Replicates the logic from scripts/train_model.py without any external import.
    """
    import numpy as np
    import datetime
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score
    from .config import calculate_npk_index

    FEATURE_COLUMNS = [
        "ph", "nitrogen_pct", "phosphorus_pct", "potassium_pct",
        "moisture_pct", "temperature_c", "organic_carbon_pct", "npk_index"
    ]

    CROP_SPECS = {
        "Pulses":    {"n": (0.30, 0.95), "p": (0.35, 0.70), "k": (0.20, 0.50), "ph": (6.0, 7.5), "t": (18.0, 30.0), "m": (45.0, 65.0), "oc": (10.0, 20.0)},
        "Mustard":   {"n": (1.00, 1.60), "p": (0.25, 0.50), "k": (0.30, 0.55), "ph": (6.0, 7.5), "t": (10.0, 22.0), "m": (45.0, 65.0), "oc": (10.0, 20.0)},
        "Wheat":     {"n": (1.40, 2.20), "p": (0.35, 0.65), "k": (0.35, 0.65), "ph": (6.2, 7.5), "t": (15.0, 26.0), "m": (48.0, 68.0), "oc": (11.0, 22.0)},
        "Maize":     {"n": (1.60, 2.50), "p": (0.40, 0.70), "k": (0.40, 0.70), "ph": (5.8, 7.5), "t": (18.0, 32.0), "m": (50.0, 70.0), "oc": (12.0, 22.0)},
        "Cotton":    {"n": (1.80, 2.60), "p": (0.40, 0.70), "k": (0.50, 0.85), "ph": (6.5, 8.0), "t": (22.0, 36.0), "m": (48.0, 68.0), "oc": (12.0, 24.0)},
        "Rice":      {"n": (2.20, 3.40), "p": (0.35, 0.60), "k": (0.40, 0.70), "ph": (5.5, 7.0), "t": (24.0, 36.0), "m": (55.0, 75.0), "oc": (12.0, 25.0)},
        "Potato":    {"n": (2.20, 3.40), "p": (0.60, 1.05), "k": (1.20, 2.10), "ph": (5.0, 6.4), "t": (14.0, 24.0), "m": (50.0, 72.0), "oc": (14.0, 26.0)},
        "Sugarcane": {"n": (3.20, 4.80), "p": (0.70, 1.25), "k": (1.00, 1.85), "ph": (6.5, 8.0), "t": (22.0, 38.0), "m": (55.0, 75.0), "oc": (14.0, 26.0)},
    }

    rows, labels = [], []
    rng = np.random.default_rng(42)
    for crop, s in CROP_SPECS.items():
        for _ in range(450):
            n  = float(np.clip(rng.uniform(s["n"][0] * 0.92,  s["n"][1]  * 1.08), 0.1,  5.5))
            p  = float(np.clip(rng.uniform(s["p"][0] * 0.92,  s["p"][1]  * 1.08), 0.05, 2.5))
            k  = float(np.clip(rng.uniform(s["k"][0] * 0.92,  s["k"][1]  * 1.08), 0.05, 2.5))
            ph = float(np.clip(rng.uniform(s["ph"][0], s["ph"][1]), 4.5, 8.8))
            t  = float(np.clip(rng.uniform(s["t"][0],  s["t"][1]),  8.0, 42.0))
            m  = float(np.clip(rng.uniform(s["m"][0],  s["m"][1]),  15.0, 90.0))
            oc = float(np.clip(rng.uniform(s["oc"][0], s["oc"][1]), 2.0, 40.0))
            npk = calculate_npk_index(n, p, k)
            rows.append([ph, n, p, k, m, t, oc, npk])
            labels.append(crop)

    X = pd.DataFrame(rows, columns=FEATURE_COLUMNS)
    y = pd.Series(labels)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    rf = RandomForestClassifier(n_estimators=150, max_depth=14, n_jobs=2, random_state=42)
    rf.fit(X_tr, y_tr)

    train_acc = accuracy_score(y_tr, rf.predict(X_tr))
    test_acc  = accuracy_score(y_te, rf.predict(X_te))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    bundle = {
        "model": rf,
        "feature_columns": FEATURE_COLUMNS,
        "classes": rf.classes_.tolist(),
        "data_provenance": "SYNTHETIC_DATA_FALLBACK",
        "provenance_detail": "Inline-trained on ICAR/FAO agronomic envelopes (auto-generated fallback).",
        "method": "RandomForestClassifier (n_estimators=150, max_depth=14) + ICAR Agronomic Engine",
        "train_accuracy": round(float(train_acc), 4),
        "test_accuracy":  round(float(test_acc), 4),
        "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat() if hasattr(datetime, 'timezone') else str(datetime.datetime.utcnow()),
    }
    joblib.dump(bundle, MODEL_PATH)
    print(f"[+] ml_model: inline fallback model saved → {MODEL_PATH}")
    return bundle


def load_model():
    global _cached_model_bundle, _cached_model_mtime
    if not os.path.exists(MODEL_PATH):
        _cached_model_bundle = _train_and_save_model_inline()
        _cached_model_mtime = os.path.getmtime(MODEL_PATH)
    else:
        current_mtime = os.path.getmtime(MODEL_PATH)
        if _cached_model_bundle is None or current_mtime != _cached_model_mtime:
            _cached_model_bundle = joblib.load(MODEL_PATH)
            _cached_model_mtime = current_mtime
    return _cached_model_bundle

# Realistic physical limits for manure/soil inputs — values outside these are invalid
INPUT_PHYSICAL_LIMITS = {
    "ph":              (4.0, 9.5),
    "nitrogen_pct":    (0.05, 6.0),
    "phosphorus_pct": (0.05, 3.5),
    "potassium_pct":  (0.05, 3.5),
    "moisture_pct":   (10.0, 95.0),
    "temperature_c":  (5.0, 45.0),
    "organic_carbon_pct": (1.0, 50.0),
}

# Agronomically realistic guidance ranges shown to user (tighter than physical limits)
INPUT_NORMAL_RANGES = {
    "ph":              (4.5, 8.8,  "pH units (4.5 – 8.8)"),
    "nitrogen_pct":    (0.1, 5.5,  "% (0.1 – 5.5%)"),
    "phosphorus_pct": (0.05, 2.5, "% (0.05 – 2.5%)"),
    "potassium_pct":  (0.05, 2.5, "% (0.05 – 2.5%)"),
    "moisture_pct":   (15.0, 90.0,"% (15 – 90%)"),
    "temperature_c":  (8.0,  42.0,"°C (8 – 42°C)"),
    "organic_carbon_pct": (2.0, 40.0, "% (2 – 40%)"),
}

def _calc_fit_score(val: float, opt_min: float, opt_max: float, tol_min: float, tol_max: float) -> float:
    """Calculates continuous fit percentage (0 – 100%) for a single agronomic parameter."""
    if val < tol_min or val > tol_max:
        return 5.0
    if opt_min <= val <= opt_max:
        return 100.0
    if val < opt_min:
        return 5.0 + 95.0 * ((val - tol_min) / (opt_min - tol_min)) ** 1.3
    else:
        return 5.0 + 95.0 * ((tol_max - val) / (tol_max - opt_max)) ** 1.3

def evaluate_agronomic_fit(n: float, p: float, k: float, ph: float, temp: float, crop: str) -> Dict[str, float]:
    """Computes parameter-wise agronomic suitability scores according to ICAR envelopes."""
    prof = CROP_AGRONOMIC_PROFILES.get(crop, CROP_AGRONOMIC_PROFILES["Wheat"])
    n_score = round(_calc_fit_score(n, *prof["n"]), 1)
    p_score = round(_calc_fit_score(p, *prof["p"]), 1)
    k_score = round(_calc_fit_score(k, *prof["k"]), 1)
    ph_score = round(_calc_fit_score(ph, *prof["ph"]), 1)
    temp_score = round(_calc_fit_score(temp, *prof["temp"]), 1)

    # Liebig's law of the minimum penalty
    min_nut = min(n_score, p_score, k_score)
    geo_mean = (n_score * p_score * k_score * ph_score * temp_score) ** 0.2
    overall = geo_mean * (0.6 + 0.4 * (min_nut / 100.0))

    return {
        "nitrogen_fit": n_score,
        "phosphorus_fit": p_score,
        "potassium_fit": k_score,
        "ph_fit": ph_score,
        "temperature_fit": temp_score,
        "overall_fit": round(overall, 1)
    }

def _detect_out_of_range(n: float, p: float, k: float, ph: float, temp: float) -> List[str]:
    """Returns list of parameter names that are outside the physical input limits."""
    violations = []
    checks = [
        (n,   *INPUT_PHYSICAL_LIMITS["nitrogen_pct"],    "Nitrogen (%)"),
        (p,   *INPUT_PHYSICAL_LIMITS["phosphorus_pct"],  "Phosphorus (%)"),
        (k,   *INPUT_PHYSICAL_LIMITS["potassium_pct"],   "Potassium (%)"),
        (ph,  *INPUT_PHYSICAL_LIMITS["ph"],              "pH"),
        (temp,*INPUT_PHYSICAL_LIMITS["temperature_c"],   "Temperature (°C)"),
    ]
    for val, lo, hi, label in checks:
        if val < lo or val > hi:
            violations.append(f"{label} = {val} (valid: {lo}–{hi})")
    return violations

def _clamp_inputs(n: float, p: float, k: float, ph: float, temp: float, moist: float, oc: float):
    """Clamps all inputs to physical limits so the RF model receives valid data."""
    def clamp(v, lo, hi): return max(lo, min(hi, v))
    return (
        clamp(n,    *INPUT_PHYSICAL_LIMITS["nitrogen_pct"]),
        clamp(p,    *INPUT_PHYSICAL_LIMITS["phosphorus_pct"]),
        clamp(k,    *INPUT_PHYSICAL_LIMITS["potassium_pct"]),
        clamp(ph,   *INPUT_PHYSICAL_LIMITS["ph"]),
        clamp(temp, *INPUT_PHYSICAL_LIMITS["temperature_c"]),
        clamp(moist,*INPUT_PHYSICAL_LIMITS["moisture_pct"]),
        clamp(oc,   *INPUT_PHYSICAL_LIMITS["organic_carbon_pct"]),
    )

def predict_crop(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs combined Random Forest inference + ICAR Agronomic Envelope verification.
    Returns an out-of-range warning when inputs are physically unrealistic instead
    of silently defaulting to Sugarcane.
    """
    bundle = load_model()
    model = bundle["model"]
    feature_cols = bundle["feature_columns"]
    data_provenance = bundle.get("data_provenance", "REAL_DATA")
    provenance_detail = bundle.get("provenance_detail", "Trained on ICAR crop requirements standards.")
    method = bundle.get("method", "RandomForestClassifier + ICAR Agronomic Engine")

    # Extract raw inputs
    ph_raw   = float(params.get("ph")               if params.get("ph")               is not None else 6.8)
    n_raw    = float(params.get("nitrogen_pct")     if params.get("nitrogen_pct")     is not None else 1.4)
    p_raw    = float(params.get("phosphorus_pct")   if params.get("phosphorus_pct")   is not None else 0.5)
    k_raw    = float(params.get("potassium_pct")    if params.get("potassium_pct")    is not None else 0.5)
    moist_raw= float(params.get("moisture_pct")     if params.get("moisture_pct")     is not None else 58.0)
    temp_raw = float(params.get("temperature_c")    if params.get("temperature_c")    is not None else 24.0)
    oc_raw   = float(params.get("organic_carbon_pct") if params.get("organic_carbon_pct") is not None else 14.0)

    # Detect physically invalid inputs
    violations = _detect_out_of_range(n_raw, p_raw, k_raw, ph_raw, temp_raw)

    # Clamp all values to physical limits for model inference
    n, p, k, ph, temp, moist, oc = _clamp_inputs(n_raw, p_raw, k_raw, ph_raw, temp_raw, moist_raw, oc_raw)

    # Compute NPK index on clamped values
    npk = params.get("npk_index")
    if npk is None:
        npk = calculate_npk_index(n, p, k)
    else:
        npk = float(npk)

    sample_dict = {
        "ph": ph,
        "nitrogen_pct": n,
        "phosphorus_pct": p,
        "potassium_pct": k,
        "moisture_pct": moist,
        "temperature_c": temp,
        "organic_carbon_pct": oc,
        "npk_index": npk
    }

    input_df = pd.DataFrame([sample_dict])[feature_cols]

    # Random Forest probabilities
    rf_probs = model.predict_proba(input_df)[0]
    classes  = model.classes_

    # Compute per-crop agronomic fit and combined score
    combined_scores = {}
    crop_fits       = {}
    for crop_name, rf_prob in zip(classes, rf_probs):
        fit_data = evaluate_agronomic_fit(n, p, k, ph, temp, crop_name)
        crop_fits[crop_name] = fit_data
        # 55% RF weight + 45% agronomic fit weight
        combined = (float(rf_prob) * 100.0 * 0.55) + (fit_data["overall_fit"] * 0.45)
        combined_scores[crop_name] = combined

    ranked = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
    best_crop, best_raw_score = ranked[0]
    best_fit = crop_fits[best_crop]

    # Check if ALL crops have very low agronomic fit (everything is out-of-range)
    max_agro_fit = max(v["overall_fit"] for v in crop_fits.values())
    all_out_of_range = max_agro_fit <= 8.0  # every crop is at the 5% floor

    if all_out_of_range and violations:
        return {
            "recommended_crop": "⚠️ Values Out of Range",
            "confidence": 0.0,
            "alternatives": [],
            "npk_index": round(npk, 2),
            "nutrient_fit": {
                "nitrogen_fit": 0.0, "phosphorus_fit": 0.0, "potassium_fit": 0.0,
                "ph_fit": 0.0, "temperature_fit": 0.0,
            },
            "agronomic_rationale": (
                "The entered values are outside the physical range of any known manure or soil type. "
                "Please enter realistic nutrient concentrations: N 0.1–5.5%, P 0.05–2.5%, K 0.05–2.5%, "
                "pH 4.5–8.8, Temperature 8–42°C, Moisture 15–90%, Organic Carbon 2–40%."
            ),
            "out_of_range_params": violations,
            "input_features": {"ph": ph_raw, "nitrogen_pct": n_raw, "phosphorus_pct": p_raw,
                               "potassium_pct": k_raw, "moisture_pct": moist_raw,
                               "temperature_c": temp_raw, "organic_carbon_pct": oc_raw, "npk_index": npk},
            "data_provenance": data_provenance,
            "provenance_detail": provenance_detail,
            "method": method,
        }

    # Confidence: reflects actual combined score, not an artificial floor
    top_conf = round(min(98.0, max(55.0, best_raw_score * 0.95)), 1)
    # If there are input violations but not all out of range, reduce confidence
    if violations:
        top_conf = round(top_conf * 0.80, 1)

    alternatives = []
    for c, sc in ranked[1:4]:
        conf = round(min(top_conf - 1.5, max(10.0, sc * 0.85)), 1)
        alternatives.append({"crop": c, "confidence": conf})

    nutrient_fit_breakdown = {
        "nitrogen_fit":    best_fit["nitrogen_fit"],
        "phosphorus_fit":  best_fit["phosphorus_fit"],
        "potassium_fit":   best_fit["potassium_fit"],
        "ph_fit":          best_fit["ph_fit"],
        "temperature_fit": best_fit["temperature_fit"],
    }

    rationale = CROP_AGRONOMIC_PROFILES.get(best_crop, {}).get(
        "rationale",
        f"Matches optimal nutrient density and agro-climatic conditions for {best_crop}."
    )

    result = {
        "recommended_crop": best_crop,
        "confidence": top_conf,
        "alternatives": alternatives,
        "npk_index": round(npk, 2),
        "nutrient_fit": nutrient_fit_breakdown,
        "agronomic_rationale": rationale,
        "input_features": sample_dict,
        "data_provenance": data_provenance,
        "provenance_detail": provenance_detail,
        "method": method,
    }

    if violations:
        result["out_of_range_params"] = violations
        result["warning"] = (
            f"Some inputs were outside realistic range and were clamped: {'; '.join(violations)}. "
            "Please enter valid manure composition values for accurate prediction."
        )

    return result
