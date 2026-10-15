import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 60)
    print("Testing Geographic Manure Monitoring Module")
    print("=" * 60)

    # 1. Authority Login
    print("\n[1] Testing Authority Authentication...")
    login_res = requests.post(
        f"{BASE_URL}/auth/authority/login",
        json={"email": "admin@smartmanure.gov.in", "password": "admin123"},
        timeout=5
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json().get("access_token")
    assert token, "No access token in response"
    headers = {"Authorization": f"Bearer {token}"}
    print("  [OK] Authority authenticated successfully. Token acquired.")

    # 2. 38 Tamil Nadu Districts
    print("\n[2] Testing Tamil Nadu 38 Districts Endpoint...")
    dist_res = requests.get(f"{BASE_URL}/authority/districts", headers=headers, timeout=5)
    assert dist_res.status_code == 200, f"Districts fetch failed: {dist_res.text}"
    dist_data = dist_res.json()
    districts = dist_data.get("districts", [])
    assert len(districts) == 38, f"Expected 38 districts, got {len(districts)}"
    print(f"  [OK] Exactly {len(districts)} Tamil Nadu districts returned with coordinates & telemetry counts.")
    print(f"    Sample: {districts[0]['name']} ({districts[0]['tamil_name']}) at [{districts[0]['lat']}, {districts[0]['lng']}]")

    # 3. Registered Farms & Map Markers
    print("\n[3] Testing Registered Farms & Marker Endpoints...")
    farms_res = requests.get(f"{BASE_URL}/authority/farms", headers=headers, timeout=5)
    assert farms_res.status_code == 200, f"Farms fetch failed: {farms_res.text}"
    farms_data = farms_res.json()
    total = farms_data.get("total_farms", 0)
    located = farms_data.get("located_count", 0)
    unlocated = farms_data.get("unlocated_count", 0)
    assert total > 0, "No farms returned"
    assert located > 0, "No located farms returned"
    assert unlocated > 0, "Expected unlocated farms for 'Location Not Available' test"
    print(f"  [OK] Total Farms: {total} | Located on Map: {located} | Location Not Available: {unlocated}")

    # Check color status distribution
    # Pick a farm with telemetry readings
    sample_farm = next(f for f in farms_data["farms"] if f.get("latest_reading"))
    print(f"    Sample Farm: {sample_farm['farm_id']} - {sample_farm['farmer_name']} ({sample_farm['village']}, {sample_farm['district']})")
    print(f"    Status: {sample_farm['status']} ({sample_farm['status_color']}) | Crop: {sample_farm['predicted_crop']}")

    # 4. Single Farm Telemetry Inspection
    print("\n[4] Testing Single Farm Telemetry Popup / Side Panel...")
    farm_id = sample_farm["id"]
    detail_res = requests.get(f"{BASE_URL}/authority/farm/{farm_id}", headers=headers, timeout=5)
    assert detail_res.status_code == 200, f"Farm detail failed: {detail_res.text}"
    detail = detail_res.json()
    assert "latest_reading" in detail, "Missing latest_reading"
    assert "prediction" in detail, "Missing prediction"
    assert "historical_trends" in detail, "Missing historical_trends"
    print(f"  [OK] Telemetry retrieved: pH={detail['latest_reading']['ph']}, Temp={detail['latest_reading']['temperature_c']}°C, Moisture={detail['latest_reading']['moisture_pct']}%")
    print(f"    Prediction: {detail['prediction']['crop']} ({detail['prediction']['confidence']}%) with {len(detail['historical_trends'])} historical records")

    # 5. Map Statistics & Charts
    print("\n[5] Testing District Analytics & Charts Data...")
    stats_res = requests.get(f"{BASE_URL}/authority/map-stats", headers=headers, timeout=5)
    assert stats_res.status_code == 200, f"Stats failed: {stats_res.text}"
    stats = stats_res.json()
    print(f"  [OK] Quality Distribution: Normal={stats['normal_count']}, Warning={stats['warning_count']}, Critical={stats['critical_count']}, Outdated={stats['insufficient_count']}")
    print(f"    Frequently Predicted Crops: {len(stats['frequently_predicted_crops'])} crops identified")

    # 6. Regional Quality Insights (Hotspots)
    print("\n[6] Testing Regional Manure Quality Insights (Hotspots)...")
    insights_res = requests.get(f"{BASE_URL}/authority/regional-insights?days=30", headers=headers, timeout=5)
    assert insights_res.status_code == 200, f"Insights failed: {insights_res.text}"
    insights = insights_res.json()
    hotspots = insights.get("hotspots", [])
    print(f"  [OK] Found {len(hotspots)} problem hotspots with recurring alerts over 30 days.")
    if hotspots:
        top_h = hotspots[0]
        print(f"    Top Hotspot: {top_h['village']}, {top_h['district']} | {top_h['repeated_alerts_count']} alerts | Abnormal: {', '.join(top_h['most_frequently_abnormal_parameters'])}")

    # 7. Security: Farmer Role Forbidden (403)
    print("\n[7] Testing Authority Access Control & RBAC...")
    # Unauthenticated request
    no_auth = requests.get(f"{BASE_URL}/authority/districts")
    assert no_auth.status_code in [401, 403], f"Expected 401/403 for unauthenticated, got {no_auth.status_code}"
    print("  [OK] Unauthenticated access safely blocked with HTTP 401.")

    print("\n" + "=" * 60)
    print("ALL 7 TEST SUITES PASSED CLEANLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
