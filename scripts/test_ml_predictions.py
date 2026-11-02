import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.core.ml_model import predict_crop

test_cases = [
    (
        "Low N, Moderate P/K, Warm (Pulses)",
        {"ph": 6.8, "nitrogen_pct": 0.6, "phosphorus_pct": 0.5, "potassium_pct": 0.35, "moisture_pct": 55.0, "temperature_c": 24.0, "organic_carbon_pct": 12.0}
    ),
    (
        "Cool Temperature, Moderate N (Mustard)",
        {"ph": 6.8, "nitrogen_pct": 1.2, "phosphorus_pct": 0.35, "potassium_pct": 0.4, "moisture_pct": 55.0, "temperature_c": 16.0, "organic_carbon_pct": 12.0}
    ),
    (
        "Balanced Moderate NPK, Cool-Mid (Wheat)",
        {"ph": 6.8, "nitrogen_pct": 1.8, "phosphorus_pct": 0.5, "potassium_pct": 0.5, "moisture_pct": 58.0, "temperature_c": 20.0, "organic_carbon_pct": 16.0}
    ),
    (
        "Moderate-High N, Warm (Maize)",
        {"ph": 6.5, "nitrogen_pct": 2.0, "phosphorus_pct": 0.55, "potassium_pct": 0.55, "moisture_pct": 60.0, "temperature_c": 26.0, "organic_carbon_pct": 16.0}
    ),
    (
        "High Potassium, Acidic pH, Cool (Potato)",
        {"ph": 5.5, "nitrogen_pct": 2.6, "phosphorus_pct": 0.85, "potassium_pct": 1.8, "moisture_pct": 62.0, "temperature_c": 18.0, "organic_carbon_pct": 18.0}
    ),
    (
        "High Nitrogen, Warm & Humid (Rice)",
        {"ph": 6.2, "nitrogen_pct": 2.8, "phosphorus_pct": 0.48, "potassium_pct": 0.55, "moisture_pct": 68.0, "temperature_c": 30.0, "organic_carbon_pct": 18.0}
    ),
    (
        "Alkaline pH, High Temp, Good K (Cotton)",
        {"ph": 7.6, "nitrogen_pct": 2.2, "phosphorus_pct": 0.55, "potassium_pct": 0.75, "moisture_pct": 58.0, "temperature_c": 32.0, "organic_carbon_pct": 16.0}
    ),
    (
        "Exhaustive High NPK, Warm (Sugarcane)",
        {"ph": 7.2, "nitrogen_pct": 4.2, "phosphorus_pct": 1.1, "potassium_pct": 1.6, "moisture_pct": 65.0, "temperature_c": 30.0, "organic_carbon_pct": 22.0}
    ),
]

if __name__ == "__main__":
    print("\n--- ML MODEL SENSITIVITY VERIFICATION ---\n")
    all_matched = True
    for label, inputs in test_cases:
        res = predict_crop(inputs)
        crop = res["recommended_crop"]
        conf = res["confidence"]
        npk = res["npk_index"]
        print(f"Test: {label}")
        print(f"  Inputs: N={inputs['nitrogen_pct']}%, P={inputs['phosphorus_pct']}%, K={inputs['potassium_pct']}%, pH={inputs['ph']}, Temp={inputs['temperature_c']}°C, Moist={inputs['moisture_pct']}%")
        print(f"  -> Recommended Crop: {crop} | Confidence: {conf}% | NPK Index: {npk}")
        alts = ", ".join([f"{a['crop']} ({a['confidence']}%)" for a in res.get("alternatives", [])])
        print(f"  -> Alternatives: {alts}")
        print()
    print("Verification completed.")

