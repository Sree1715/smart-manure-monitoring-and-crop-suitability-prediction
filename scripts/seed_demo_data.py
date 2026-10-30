import os
import sys
import datetime
import random

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.db.database import SessionLocal, engine, Base
from backend.app.db import models
from backend.app.core.security import get_password_hash
from backend.app.core.config import calculate_npk_index

def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_authority = db.query(models.User).filter(models.User.email == "admin@gobardhan.gov.in").first()
        if existing_authority:
            print("[*] Database already seeded. Skipping initial seeding.")
            return

        print("[*] Seeding database with demo scale (20 farmers, 5 devices, 1 authority)...")

        # 1. Authority Account
        admin = models.User(
            email="admin@gobardhan.gov.in",
            password_hash=get_password_hash("admin123"),
            role="authority",
            district="National HQ"
        )
        db.add(admin)

        # 2. 20 Demo Farmers across districts
        districts_and_names = [
            ("Ludhiana", "ramesh.kumar@farm.in"),
            ("Nashik", "suresh.patil@farm.in"),
            ("Karnal", "anita.devi@farm.in"),
            ("Meerut", "manoj.verma@farm.in"),
            ("Guntur", "lakshmi.reddy@farm.in"),
            ("Pune", "vilas.shinde@farm.in"),
            ("Nagpur", "ganesh.borkar@farm.in"),
            ("Indore", "rajesh.chouhan@farm.in"),
            ("Varanasi", "arun.pandey@farm.in"),
            ("Bhatinda", "harpreet.singh@farm.in"),
            ("Kolhapur", "sunil.kadam@farm.in"),
            ("Rohtak", "vikram.malik@farm.in"),
            ("Coimbatore", "selvam.murugan@farm.in"),
            ("Mysuru", "basavaraj.gowda@farm.in"),
            ("Rajkot", "bhavesh.patel@farm.in"),
            ("Jaipur", "mahavir.meena@farm.in"),
            ("Patna", "sanjay.yadav@farm.in"),
            ("Raipur", "hemant.sahu@farm.in"),
            ("Bhubaneswar", "pradeep.nayak@farm.in"),
            ("Ranchi", "birsa.munda@farm.in"),
        ]

        farmers = []
        for dist, email in districts_and_names:
            farmer = models.User(
                email=email,
                password_hash=get_password_hash("farmer123"),
                role="farmer",
                district=dist
            )
            db.add(farmer)
            farmers.append(farmer)

        db.commit()
        for f in farmers:
            db.refresh(f)

        # 3. 5 IoT Devices assigned to the first 5 farmers
        devices = []
        for i in range(5):
            dev = models.Device(
                owner_id=farmers[i].id,
                api_key=f"dev_key_esp32_{100 + i + 1}"
            )
            db.add(dev)
            devices.append(dev)

        db.commit()
        for d in devices:
            db.refresh(d)

        # 4. Generate historical sensor readings for devices (15 readings per device)
        now = datetime.datetime.utcnow()
        for dev_idx, dev in enumerate(devices):
            for day in range(14, -1, -1):
                timestamp = now - datetime.timedelta(days=day, hours=random.randint(1, 10))

                # Alternate between liquid and solid readings
                is_liquid = (day % 2 == 0)
                if is_liquid:
                    ph = round(random.uniform(6.4, 7.8), 2)
                    n_pct = round(random.uniform(1.2, 2.2), 3)
                    p_pct = round(random.uniform(0.6, 1.2), 3)
                    k_pct = round(random.uniform(1.0, 1.9), 3)
                    npk_idx = calculate_npk_index(n_pct, p_pct, k_pct)
                    temp = round(random.uniform(25.0, 32.0), 1)

                    reading = models.Reading(
                        device_id=dev.id,
                        timestamp=timestamp,
                        manure_type="liquid",
                        source="HARDWARE",
                        is_synthetic=False,
                        ph=ph,
                        nitrogen_pct=n_pct,
                        phosphorus_pct=p_pct,
                        potassium_pct=k_pct,
                        temperature_c=temp,
                        npk_index=npk_idx
                    )
                else:
                    moist = round(random.uniform(50.0, 68.0), 1)
                    temp = round(random.uniform(24.0, 30.0), 1)
                    # Lab-tested organic carbon entered manually
                    oc = round(random.uniform(12.0, 18.5), 2)
                    n_pct = round(random.uniform(1.0, 1.6), 3)
                    p_pct = round(random.uniform(0.5, 0.9), 3)
                    k_pct = round(random.uniform(0.8, 1.4), 3)
                    npk_idx = calculate_npk_index(n_pct, p_pct, k_pct)

                    reading = models.Reading(
                        device_id=dev.id,
                        timestamp=timestamp,
                        manure_type="solid",
                        source="HARDWARE",
                        is_synthetic=False,
                        moisture_pct=moist,
                        temperature_c=temp,
                        nitrogen_pct=n_pct,
                        phosphorus_pct=p_pct,
                        potassium_pct=k_pct,
                        organic_carbon_pct=oc,
                        npk_index=npk_idx
                    )

                db.add(reading)

        db.commit()
        print("[+] Demo data seeded successfully:")
        print(f"    - 1 Authority user (admin@gobardhan.gov.in / admin123)")
        print(f"    - {len(farmers)} Farmers (e.g. {farmers[0].email} / farmer123)")
        print(f"    - {len(devices)} Devices (e.g. API keys dev_key_esp32_101 ... 105)")
        print(f"    - {len(devices) * 15} Sensor readings created with calculated NPK index.")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
