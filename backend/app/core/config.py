import os
from dotenv import load_dotenv

load_dotenv()

# Application settings
APP_NAME = "Smart Manure Monitoring and Crop Suitability Prediction"
API_PREFIX = "/api"

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database/app.db")

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_GOBARDHAN_SIH1767_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ==============================================================================
# NPK INDEX FORMULA CONFIGURATION
# ==============================================================================
# The NPK Index quantifies overall nutrient density of the manure on a 0.0 - 10.0 scale.
# Formula:
#   NPK_Index = [ (w_N * (N% / N_ref)) + (w_P * (P% / P_ref)) + (w_K * (K% / K_ref)) ]
#               ----------------------------------------------------------------------- * 10
#                                        (w_N + w_P + w_K)
#
# Reference baselines (Ref) represent optimal target percentages for high-quality
# digested biogas slurry / enriched organic manure (ICAR / FAO guidelines):
#   - N_ref = 1.5%
#   - P_ref = 0.8%
#   - K_ref = 1.2%
# Default Weights:
#   - w_N = 1.0, w_P = 1.0, w_K = 1.0
# The result is clamped to [0.0, 10.0] and rounded to 2 decimal places.
# ==============================================================================

NPK_CONFIG = {
    "weights": {
        "nitrogen": 1.0,
        "phosphorus": 1.0,
        "potassium": 1.0,
    },
    "reference_baselines": {
        "nitrogen_pct": 1.5,     # 1.5% target N in enriched slurry
        "phosphorus_pct": 0.8,   # 0.8% target P in enriched slurry
        "potassium_pct": 1.2,    # 1.2% target K in enriched slurry
    },
    "scale_max": 10.0,
    "scale_min": 0.0,
}

def calculate_npk_index(n: float, p: float, k: float) -> float:
    """
    Computes normalized NPK nutrient index on a 0.0 to 10.0 scale.
    """
    try:
        w_n = NPK_CONFIG["weights"]["nitrogen"]
        w_p = NPK_CONFIG["weights"]["phosphorus"]
        w_k = NPK_CONFIG["weights"]["potassium"]
        
        ref_n = NPK_CONFIG["reference_baselines"]["nitrogen_pct"]
        ref_p = NPK_CONFIG["reference_baselines"]["phosphorus_pct"]
        ref_k = NPK_CONFIG["reference_baselines"]["potassium_pct"]

        score_n = (max(0.0, float(n)) / ref_n) if ref_n > 0 else 0.0
        score_p = (max(0.0, float(p)) / ref_p) if ref_p > 0 else 0.0
        score_k = (max(0.0, float(k)) / ref_k) if ref_k > 0 else 0.0

        total_weight = w_n + w_p + w_k
        weighted_score = (w_n * score_n + w_p * score_p + w_k * score_k) / total_weight

        # Normalize to 0 - 10 scale (1.0 index = benchmark quality = 10.0 score)
        index_val = weighted_score * 10.0
        clamped = max(NPK_CONFIG["scale_min"], min(NPK_CONFIG["scale_max"], index_val))
        return round(clamped, 2)
    except Exception:
        return 0.0
