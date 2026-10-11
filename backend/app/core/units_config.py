"""
Unit Conversion Configuration: Crop Nutrient Requirements (kg/ha) <-> Manure Composition (%)

Agricultural Basis:
- Crop requirements are conventionally measured in kg/ha (kilograms per hectare).
- Manure / Biogas slurry composition is measured in % (g / 100g on dry or wet basis).
- Standard organic manure application rate (A_rate): 10,000 kg/ha (10 tonnes/ha)
- Nutrient Availability Coefficients in First Growing Season (ICAR / FAO):
    * Nitrogen (N_avail): 50% (0.50) mineralized in year 1
    * Phosphorus (P_avail): 60% (0.60) available in year 1
    * Potassium (K_avail): 80% (0.80) available in year 1
- Elemental to Oxide conversions:
    * P = P2O5 * 0.4364
    * P2O5 = P / 0.4364 = P * 2.2914
    * K = K2O * 0.8302
    * K2O = K / 0.8302 = K * 1.2046

Conversion Formula:
To supply R_kg_ha of available nutrient from manure at application rate A_rate (kg/ha):
  Required Total Nutrient in Manure (kg) = R_kg_ha / Avail_coeff
  Equivalent Manure Nutrient Concentration (%) = (Required Total Nutrient / A_rate) * 100
                                                = R_kg_ha / (A_rate * Avail_coeff) * 100
"""

UNIT_CONVERSION_CONFIG = {
    "default_application_rate_kg_ha": 10000.0,  # 10 tonnes per hectare
    "availability_coefficients": {
        "nitrogen": 0.50,
        "phosphorus": 0.60,
        "potassium": 0.80,
    },
    "oxide_factors": {
        "P_from_P2O5": 0.4364,
        "P2O5_from_P": 2.2914,
        "K_from_K2O": 0.8302,
        "K2O_from_K": 1.2046,
    }
}

def crop_req_kg_ha_to_manure_pct(n_kg_ha: float, p_kg_ha: float, k_kg_ha: float,
                                 p_basis: str = "P2O5", k_basis: str = "K2O",
                                 application_rate_kg_ha: float = 10000.0) -> dict:
    """
    Converts crop nutrient recommendation in kg/ha to equivalent required manure nutrient %.
    """
    avail = UNIT_CONVERSION_CONFIG["availability_coefficients"]
    oxide = UNIT_CONVERSION_CONFIG["oxide_factors"]

    # Convert P to elemental P if provided in P2O5
    p_elem = p_kg_ha * oxide["P_from_P2O5"] if p_basis.upper() == "P2O5" else p_kg_ha
    # Convert K to elemental K if provided in K2O
    k_elem = k_kg_ha * oxide["K_from_K2O"] if k_basis.upper() == "K2O" else k_kg_ha

    # Calculate required manure concentration %
    n_pct = (n_kg_ha / (application_rate_kg_ha * avail["nitrogen"])) * 100.0
    p_pct = (p_elem / (application_rate_kg_ha * avail["phosphorus"])) * 100.0
    k_pct = (k_elem / (application_rate_kg_ha * avail["potassium"])) * 100.0

    return {
        "n_pct": round(n_pct, 3),
        "p_pct": round(p_pct, 3),
        "k_pct": round(k_pct, 3)
    }

def manure_pct_to_supplied_kg_ha(n_pct: float, p_pct: float, k_pct: float,
                                 application_rate_kg_ha: float = 10000.0) -> dict:
    """
    Computes available nutrients supplied (kg/ha) from manure nutrient % at given application rate.
    """
    avail = UNIT_CONVERSION_CONFIG["availability_coefficients"]

    n_supplied = application_rate_kg_ha * (n_pct / 100.0) * avail["nitrogen"]
    p_supplied = application_rate_kg_ha * (p_pct / 100.0) * avail["phosphorus"]
    k_supplied = application_rate_kg_ha * (k_pct / 100.0) * avail["potassium"]

    return {
        "n_kg_ha_supplied": round(n_supplied, 2),
        "p_kg_ha_supplied": round(p_supplied, 2),
        "k_kg_ha_supplied": round(k_supplied, 2)
    }
