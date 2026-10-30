import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import calculate_npk_index
from backend.app.core.units_config import crop_req_kg_ha_to_manure_pct, manure_pct_to_supplied_kg_ha

client = TestClient(app)

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert "GOBARdhan" in res.json()["message"]

    res_h = client.get("/api/health")
    assert res_h.status_code == 200
    assert res_h.json()["status"] == "healthy"

def test_auth_flow():
    # Login as admin authority
    login_admin = client.post("/api/auth/login", json={
        "email": "admin@gobardhan.gov.in",
        "password": "admin123"
    })
    assert login_admin.status_code == 200
    data = login_admin.json()
    assert "access_token" in data

    # Login as seeded farmer
    login_farmer = client.post("/api/auth/login", json={
        "email": "ramesh.kumar@farm.in",
        "password": "farmer123"
    })
    assert login_farmer.status_code == 200

def test_hardware_reading_ingest():
    # Ingest using valid device key dev_key_esp32_101
    payload = {
        "device_id": 1,
        "manure_type": "liquid",
        "ph": 7.1,
        "nitrogen_pct": 1.6,
        "phosphorus_pct": 0.85,
        "potassium_pct": 1.3,
        "temperature_c": 27.5
    }
    headers = {"X-Device-Key": "dev_key_esp32_101"}
    res = client.post("/api/readings/ingest", json=payload, headers=headers)
    assert res.status_code == 200
    resp_data = res.json()
    assert resp_data["status"] == "success"
    assert resp_data["npk_index"] > 0

    # Ingest with invalid device key should return 401
    bad_res = client.post("/api/readings/ingest", json=payload, headers={"X-Device-Key": "invalid_key"})
    assert bad_res.status_code == 401

def test_readings_listing_and_stats():
    res = client.get("/api/readings?limit=10")
    assert res.status_code == 200
    assert len(res.json()) > 0

    stats = client.get("/api/readings/stats")
    assert stats.status_code == 200
    s_data = stats.json()
    assert "liquid_ph" in s_data
    assert "solid_moisture_pct" in s_data
    assert "npk_index" in s_data

def test_prediction_endpoint():
    # Test prediction with live payload
    pred_payload = {
        "manure_type": "liquid",
        "ph": 6.8,
        "nitrogen_pct": 1.8,
        "phosphorus_pct": 0.9,
        "potassium_pct": 1.4,
        "moisture_pct": 60.0,
        "temperature_c": 28.0,
        "organic_carbon_pct": 15.0
    }
    res = client.post("/api/predict", json=pred_payload)
    assert res.status_code == 200
    p = res.json()
    assert "recommended_crop" in p
    assert "confidence" in p
    assert "data_provenance" in p
    assert "method" in p
    assert "alternatives" in p
    assert len(p["alternatives"]) > 0

def test_authority_endpoints_with_district_filter():
    # Global overview without filter
    res_all = client.get("/api/authority/overview")
    assert res_all.status_code == 200
    data_all = res_all.json()
    assert data_all["registered_farmers_count"] >= 20
    assert data_all["active_devices_count"] >= 5

    # Filter by specific district "Pune"
    res_pune = client.get("/api/authority/overview?district=Pune")
    assert res_pune.status_code == 200
    data_pune = res_pune.json()
    assert data_pune["filter_district"] == "Pune"
    assert data_pune["registered_farmers_count"] >= 1

    # Filter farmers list
    res_farmers_ludhiana = client.get("/api/authority/farmers?district=Ludhiana")
    assert res_farmers_ludhiana.status_code == 200
    farmers = res_farmers_ludhiana.json()
    assert len(farmers) >= 1
    assert any("ramesh.kumar" in f["email"] for f in farmers)

def test_npk_formula_and_unit_conversion():
    # Test NPK index calculation
    idx = calculate_npk_index(1.5, 0.8, 1.2)
    # Target benchmark values should yield 10.0 (maximum balanced score)
    assert idx == 10.0

    # Test half-strength values
    idx_half = calculate_npk_index(0.75, 0.4, 0.6)
    assert abs(idx_half - 5.0) < 0.1

    # Test unit conversions kg/ha to manure %
    # Example: 120 kg N, 60 kg P2O5, 40 kg K2O per ha
    converted = crop_req_kg_ha_to_manure_pct(120.0, 60.0, 40.0, p_basis="P2O5", k_basis="K2O")
    assert converted["n_pct"] > 0
    assert converted["p_pct"] > 0
    assert converted["k_pct"] > 0

if __name__ == "__main__":
    test_root_and_health()
    test_auth_flow()
    test_hardware_reading_ingest()
    test_readings_listing_and_stats()
    test_prediction_endpoint()
    test_authority_endpoints_with_district_filter()
    test_npk_formula_and_unit_conversion()
    print("ALL TESTS PASSED SUCCESSFULLY!")
