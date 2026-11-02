import datetime
import random
from sqlalchemy.orm import Session
from . import models
from ..core.security import get_password_hash
from ..core.config import calculate_npk_index

def ensure_seed_data(db: Session):
    """
    Ensures default accounts, demo farmers, devices, and readings exist on application startup.
    This guarantees that deployments (e.g. Render, Railway, Docker, or fresh local runs)
    immediately have working credentials and realistic data for testing without manual steps.
    """
    try:
        # 1. Authority Account: admin@smartmanure.gov.in
        admin = db.query(models.User).filter(models.User.email == "admin@smartmanure.gov.in").first()
        if not admin:
            admin = models.User(
                email="admin@smartmanure.gov.in",
                password_hash=get_password_hash("admin123"),
                role="authority",
                name="TN Agricultural Officer",
                phone="+91 8189939056",
                district="Chennai HQ",
                village="Directorate of Agriculture",
                farm_id="TN-AUTH-001"
            )
            db.add(admin)
            print("[+] Seed: Created default authority 'admin@smartmanure.gov.in'")
        else:
            admin.role = "authority"

        # Authority fallback: admin@gobardhan.gov.in
        admin_alt = db.query(models.User).filter(models.User.email == "admin@gobardhan.gov.in").first()
        if not admin_alt:
            admin_alt = models.User(
                email="admin@gobardhan.gov.in",
                password_hash=get_password_hash("admin123"),
                role="authority",
                name="GOBARdhan Officer",
                district="National HQ",
                farm_id="TN-AUTH-002"
            )
            db.add(admin_alt)

        # 2. Demo Farmer: ramesh.kumar@farm.in
        farmer = db.query(models.User).filter(models.User.email == "ramesh.kumar@farm.in").first()
        if not farmer:
            farmer = models.User(
                email="ramesh.kumar@farm.in",
                password_hash=get_password_hash("farmer123"),
                role="farmer",
                name="Ramesh Kumar",
                phone="+91 98421 54321",
                district="Karur",
                village="Kulithalai",
                farm_id="TN-KAR-1001",
                farm_name="Kaveri Valley Green Farm",
                latitude=10.9601,
                longitude=78.0766,
                farm_size_acres=5.2
            )
            db.add(farmer)
            db.commit()
            db.refresh(farmer)
            print("[+] Seed: Created demo farmer 'ramesh.kumar@farm.in'")
        else:
            if not farmer.farm_id:
                farmer.farm_id = "TN-KAR-1001"
            if not farmer.district:
                farmer.district = "Karur"

        # Ensure farmer has an IoT device
        device = db.query(models.Device).filter(models.Device.owner_id == farmer.id).first()
        if not device:
            device = models.Device(
                owner_id=farmer.id,
                api_key="TN-DEV-KAR-01"
            )
            db.add(device)
            db.commit()
            db.refresh(device)
            print(f"[+] Seed: Created IoT device for {farmer.email}")

            # Add default calibration config
            cal = models.DeviceCalibrationConfig(
                device_id=device.id,
                dry_adc=3200,
                wet_adc=800
            )
            db.add(cal)

        # Ensure farmer has recent readings
        readings_count = db.query(models.Reading).filter(models.Reading.device_id == device.id).count()
        if readings_count == 0:
            now = datetime.datetime.utcnow()
            sample_readings = [
                {"days_ago": 0, "type": "liquid", "ph": 6.8, "n": 1.4, "p": 0.7, "k": 1.2, "m": None, "t": 28.5, "oc": 14.5},
                {"days_ago": 1, "type": "solid",  "ph": None, "n": 1.2, "p": 0.6, "k": 1.0, "m": 58.0, "t": 27.0, "oc": 13.8},
                {"days_ago": 2, "type": "liquid", "ph": 6.7, "n": 1.35, "p": 0.65, "k": 1.15, "m": None, "t": 29.0, "oc": 14.0},
                {"days_ago": 3, "type": "solid",  "ph": None, "n": 1.15, "p": 0.58, "k": 0.95, "m": 61.0, "t": 26.5, "oc": 13.5},
                {"days_ago": 4, "type": "liquid", "ph": 6.9, "n": 1.45, "p": 0.72, "k": 1.25, "m": None, "t": 28.0, "oc": 15.0},
                {"days_ago": 5, "type": "solid",  "ph": None, "n": 1.25, "p": 0.62, "k": 1.05, "m": 57.5, "t": 27.5, "oc": 14.2},
                {"days_ago": 6, "type": "liquid", "ph": 6.6, "n": 1.3, "p": 0.6, "k": 1.1, "m": None, "t": 29.5, "oc": 13.9},
            ]
            for s in sample_readings:
                ts = now - datetime.timedelta(days=s["days_ago"], hours=random.randint(1, 4))
                npk = calculate_npk_index(s["n"], s["p"], s["k"])
                r = models.Reading(
                    device_id=device.id,
                    timestamp=ts,
                    manure_type=s["type"],
                    source="HARDWARE",
                    ph=s["ph"],
                    nitrogen_pct=s["n"],
                    phosphorus_pct=s["p"],
                    potassium_pct=s["k"],
                    moisture_pct=s["m"],
                    moisture_raw_adc=2100 if s["m"] else None,
                    temperature_c=s["t"],
                    organic_carbon_pct=s["oc"],
                    npk_index=npk
                )
                db.add(r)
            db.commit()
            print(f"[+] Seed: Added initial telemetry readings for {farmer.email}")

        # Check total users in DB — if less than 10, seed the full 38-district Tamil Nadu dataset
        total_users = db.query(models.User).count()
        if total_users < 10:
            print(f"[*] Database has only {total_users} users. Triggering full Tamil Nadu 38-district seeding...")
            try:
                from ...scripts import seed_tamil_nadu_data
                seed_tamil_nadu_data.seed_tamil_nadu()
            except Exception as e:
                print(f"[!] Background state seed notice: {e}")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[!] ensure_seed_data notice: {e}")

