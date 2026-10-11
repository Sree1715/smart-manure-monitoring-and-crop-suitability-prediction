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

def load_model():
    global _cached_model_bundle
    if _cached_model_bundle is None:
        if not os.path.exists(MODEL_PATH):
            # If not yet trained, trigger training script dynamically
            from scripts.train_model import train_and_save_model
            _cached_model_bundle = train_and_save_model()
        else:
            _cached_model_bundle = joblib.load(MODEL_PATH)
    return _cached_model_bundle

def predict_crop(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs Random Forest inference on manure sensor readings.
    Every prediction explicitly carries data_provenance and the method used per spec.
    """
    bundle = load_model()
    model = bundle["model"]
    feature_cols = bundle["feature_columns"]
    data_provenance = bundle.get("data_provenance", "SYNTHETIC_DATA_FALLBACK")
    provenance_detail = bundle.get("provenance_detail", "Synthetic dataset fallback")
    method = bundle.get("method", "RandomForestClassifier (n_estimators=150, max_depth=12, n_jobs=2)")

    # Prepare features with reasonable defaults if some are omitted
    ph = float(params.get("ph") or 6.8)
    n = float(params.get("nitrogen_pct") or 1.4)
    p = float(params.get("phosphorus_pct") or 0.8)
    k = float(params.get("potassium_pct") or 1.2)
    moist = float(params.get("moisture_pct") or 58.0)
    temp = float(params.get("temperature_c") or 28.0)
    oc = float(params.get("organic_carbon_pct") or 14.0)

    # Compute NPK index using documented formula
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

    # Predict probabilities
    probs = model.predict_proba(input_df)[0]
    classes = model.classes_

    # Sort descending by probability
    ranked = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
    best_crop, best_prob = ranked[0]

    alternatives = [
        {"crop": c, "confidence": round(float(prob) * 100, 1)}
        for c, prob in ranked[1:4]
    ]

    return {
        "recommended_crop": best_crop,
        "confidence": round(float(best_prob) * 100, 1),
        "alternatives": alternatives,
        "npk_index": npk,
        "input_features": sample_dict,
        "data_provenance": data_provenance,
        "provenance_detail": provenance_detail,
        "method": method
    }
