import os
import sys
import datetime
import random
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.db.database import SessionLocal, engine, Base
from backend.app.db import models
from backend.app.core.security import get_password_hash
from backend.app.core.config import calculate_npk_index
from backend.app.core.tamil_nadu_districts import TAMIL_NADU_DISTRICTS, MANURE_THRESHOLDS

# Comprehensive list of genuine Tamil Nadu villages per district
TN_DISTRICT_VILLAGES = {
    "Ariyalur": ["Jayankondam", "Sendurai", "Udayarpalayam", "Andimadam", "Thirumanur"],
    "Chengalpattu": ["Maduranthakam", "Tiruporur", "Cheyyur", "Thirukalukundram", "Tambaram"],
    "Chennai": ["Madhavaram", "Tondiarpet", "Mylapore", "Alandur", "Sholinganallur"],
    "Coimbatore": ["Sulur", "Pollachi", "Mettupalayam", "Kinathukadavu", "Annur", "Perur"],
    "Cuddalore": ["Chidambaram", "Panruti", "Virudhachalam", "Kattumannarkoil", "Kurinjipadi"],
    "Dharmapuri": ["Harur", "Palacode", "Pennagaram", "Karimangalam", "Nallampalli"],
    "Dindigul": ["Palani", "Oddanchatram", "Nilakkottai", "Natham", "Vedasandur"],
    "Erode": ["Gobichettipalayam", "Bhavani", "Perundurai", "Sathyamangalam", "Kodumudi"],
    "Kallakurichi": ["Sankarapuram", "Ulundurpet", "Chinnasalem", "Tirukoilur", "Kalvarayan Hills"],
    "Kancheepuram": ["Sriperumbudur", "Walajabad", "Kundrathur", "Uthiramerur"],
    "Kanniyakumari": ["Thovalai", "Agastheeswaram", "Kalkulam", "Vilavancode", "Killiyoor"],
    "Karur": ["Kulithalai", "Thogamalai", "Aravakurichi", "Krishnarayapuram", "Manmangalam", "Pugalur"],
    "Krishnagiri": ["Hosur", "Pochampalli", "Uthangarai", "Denkanikottai", "Bargur", "Shoolagiri"],
    "Madurai": ["Melur", "Vadipatti", "Usilampatti", "Tirumangalam", "Peraiyur", "Alanganallur"],
    "Mayiladuthurai": ["Sirkazhi", "Tharangambadi", "Kuthalam", "Sembanarkoil"],
    "Nagapattinam": ["Kilvelur", "Vedaranyam", "Thirukkuvalai", "Nagore"],
    "Namakkal": ["Rasipuram", "Tiruchengode", "Paramathi Velur", "Kolli Hills", "Sendamangalam"],
    "Nilgiris": ["Udhagamandalam", "Coonoor", "Kotagiri", "Gudalur", "Pandalur"],
    "Perambalur": ["Veppanthattai", "Kunnam", "Alathur", "Padalur"],
    "Pudukkottai": ["Aranthangi", "Alangudi", "Gandarvakottai", "Viralimalai", "Iluppur", "Thirumayam"],
    "Ramanathapuram": ["Paramakudi", "Tiruvadanai", "Mudukulathur", "Kamuthi", "Rameswaram", "Kadaladi"],
    "Ranipet": ["Arakkonam", "Arcot", "Nemili", "Walajah", "Kalavai"],
    "Salem": ["Attur", "Omalur", "Mettur", "Edappadi", "Sankari", "Yercaud", "Valapady"],
    "Sivaganga": ["Karaikudi", "Devakottai", "Manamadurai", "Tiruppuvanam", "Ilayangudi", "Kalayarkovil"],
    "Tenkasi": ["Sankarankovil", "Kadayanallur", "Ambasamudram Border", "Shenkottai", "Alangulam", "Sivagiri"],
    "Thanjavur": ["Orathanadu", "Kumbakonam", "Pattukkottai", "Thiruvaiyaru", "Budalur", "Peravurani"],
    "Theni": ["Periyakulam", "Bodinayakanur", "Uthamapalayam", "Andipatti", "Cumbum"],
    "Thoothukudi": ["Kovilpatti", "Tiruchendur", "Ettayapuram", "Srivaikuntam", "Ottapidaram", "Vilathikulam"],
    "Tiruchirappalli": ["Lalgudi", "Manapparai", "Musiri", "Thuraiyur", "Srirangam", "Manachanallur"],
    "Tirunelveli": ["Ambasamudram", "Palayamkottai", "Nanguneri", "Radhapuram", "Cheranmahadevi"],
    "Tirupathur": ["Vaniyambadi", "Ambur", "Natrampalli", "Jolarpet"],
    "Tiruppur": ["Udumalaipettai", "Dharapuram", "Kangeyam", "Avinashi", "Palladam", "Madathukulam"],
    "Tiruvallur": ["Ponneri", "Gummidipoondi", "Tiruttani", "Uthukkottai", "Avadi"],
    "Tiruvannamalai": ["Polur", "Arani", "Chengam", "Cheyyar", "Vandavasi", "Kalasapakkam"],
    "Tiruvarur": ["Mannargudi", "Thiruthuraipoondi", "Needamangalam", "Nannilam", "Valangaiman"],
    "Vellore": ["Gudiyatham", "Katpadi", "Anaicut", "Kaniyambadi", "Pernambut"],
    "Viluppuram": ["Tindivanam", "Gingee", "Vanur", "Marakkanam", "Vikravandi", "Kandachipuram"],
    "Virudhunagar": ["Sivakasi", "Srivilliputhur", "Aruppukkottai", "Rajapalayam", "Sattur", "Watrap"],
}

TAMIL_FARMER_NAMES = [
    ("Muthusamy K", "muthusamy.k@tnagro.in"),
    ("Selvam Murugan", "selvam.m@tnagro.in"),
    ("Kavitha Rajan", "kavitha.r@tnagro.in"),
    ("Palanisamy V", "palanisamy.v@tnagro.in"),
    ("Subramanian R", "subramanian.r@tnagro.in"),
    ("Anbuchelvan P", "anbuchelvan.p@tnagro.in"),
    ("Lakshmi Narayanan", "lakshmi.n@tnagro.in"),
    ("Arumugam C", "arumugam.c@tnagro.in"),
    ("Dhanalakshmi S", "dhanalakshmi.s@tnagro.in"),
    ("Venkatesh S", "venkatesh.s@tnagro.in"),
    ("Karthikeyan M", "karthikeyan.m@tnagro.in"),
    ("Thangaraj G", "thangaraj.g@tnagro.in"),
    ("Saravanan B", "saravanan.b@tnagro.in"),
    ("Ganesan A", "ganesan.a@tnagro.in"),
    ("Vijayalakshmi K", "vijayalakshmi.k@tnagro.in"),
    ("Mani Maran T", "manimaran.t@tnagro.in"),
    ("Govindaraj P", "govindaraj.p@tnagro.in"),
    ("Meenakshi Sundaram", "meenakshi.s@tnagro.in"),
    ("Balamurugan N", "balamurugan.n@tnagro.in"),
    ("Rajendran S", "rajendran.s@tnagro.in"),
    ("Senthil Nathan", "senthil.n@tnagro.in"),
    ("Kannan V", "kannan.v@tnagro.in"),
    ("Perumal Swamy", "perumal.s@tnagro.in"),
    ("Saraswathi M", "saraswathi.m@tnagro.in"),
    ("Chinnasamy R", "chinnasamy.r@tnagro.in"),
    ("Shanmugam K", "shanmugam.k@tnagro.in"),
    ("Murugesan P", "murugesan.p@tnagro.in"),
    ("Natarajan V", "natarajan.v@tnagro.in"),
    ("Kaliappan S", "kaliappan.s@tnagro.in"),
    ("Bose Pandian", "bose.p@tnagro.in"),
    ("Karuppasamy M", "karuppasamy.m@tnagro.in"),
    ("Sundaravadivel", "sundaravadivel@tnagro.in"),
    ("Ponnumani R", "ponnumani.r@tnagro.in"),
    ("Jeyaram K", "jeyaram.k@tnagro.in"),
    ("Alagarsamy T", "alagarsamy.t@tnagro.in"),
    ("Thirumoorthy N", "thirumoorthy.n@tnagro.in"),
    ("Chelladurai P", "chelladurai.p@tnagro.in"),
    ("Pandian V", "pandian.v@tnagro.in"),
]

def migrate_database():
    """Ensure all required columns exist in SQLite database without losing data."""
    db_path = os.path.join(BASE_DIR, "database", "app.db")
    if not os.path.exists(db_path):
        Base.metadata.create_all(bind=engine)
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check columns in users table
    cursor.execute("PRAGMA table_info(users)")
    existing_cols = [row[1] for row in cursor.fetchall()]

    new_cols = [
        ("name", "TEXT"),
        ("phone", "TEXT"),
        ("farm_id", "TEXT"),
        ("farm_name", "TEXT"),
        ("village", "TEXT"),
        ("latitude", "REAL"),
        ("longitude", "REAL"),
        ("farm_size_acres", "REAL"),
    ]

    for col_name, col_type in new_cols:
        if col_name not in existing_cols:
            print(f"[*] Adding column '{col_name}' ({col_type}) to 'users' table...")
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")

    conn.commit()
    conn.close()

    # Create alerts table if not exists
    Base.metadata.create_all(bind=engine)

def seed_tamil_nadu_data():
    migrate_database()
    db = SessionLocal()

    try:
        print("[*] Cleaning up old Gobardhan default scheme districts...")
        
        # Keep real registered user emails safe
        whitelist_emails = {
            "sujith200720@gmail.com",
            "sree.prithiv0713@gmail.com",
            "927625bad163@mkce.ac.in",
            "s2493293@gmail.com",
            "test@example.com",
        }

        # Remove old demo farmers that had non-TN Gobardhan districts
        gobardhan_demo_emails = [
            "ramesh.kumar@farm.in", "suresh.patil@farm.in", "anita.devi@farm.in",
            "manoj.verma@farm.in", "lakshmi.reddy@farm.in", "vilas.shinde@farm.in",
            "ganesh.borkar@farm.in", "rajesh.chouhan@farm.in", "arun.pandey@farm.in",
            "harpreet.singh@farm.in", "sunil.kadam@farm.in", "vikram.malik@farm.in",
            "selvam.murugan@farm.in", "basavaraj.gowda@farm.in", "bhavesh.patel@farm.in",
            "mahavir.meena@farm.in", "sanjay.yadav@farm.in", "hemant.sahu@farm.in",
            "pradeep.nayak@farm.in", "birsa.munda@farm.in"
        ]

        # Delete old demo users and their devices/readings
        old_users = db.query(models.User).filter(models.User.email.in_(gobardhan_demo_emails)).all()
        for u in old_users:
            devs = db.query(models.Device).filter(models.Device.owner_id == u.id).all()
            for d in devs:
                db.query(models.Reading).filter(models.Reading.device_id == d.id).delete()
                db.delete(d)
            db.query(models.Alert).filter(models.Alert.user_id == u.id).delete()
            db.delete(u)
        db.commit()

        # Update or create Authority account
        admin_emails = ["admin@smartmanure.gov.in", "admin@gobardhan.gov.in"]
        for a_email in admin_emails:
            admin_user = db.query(models.User).filter(models.User.email == a_email).first()
            if not admin_user:
                admin_user = models.User(
                    email=a_email,
                    password_hash=get_password_hash("admin123"),
                    role="authority",
                    name="TN Agricultural Officer",
                    phone="+91 8189939056",
                    district="Chennai HQ",
                    village="Directorate of Agriculture"
                )
                db.add(admin_user)
            else:
                admin_user.role = "authority"
                admin_user.name = "TN Agricultural Officer"
                admin_user.district = "Chennai HQ"
        db.commit()

        # Assign existing whitelisted user accounts to Karur, Tamil Nadu
        whitelisted_users = db.query(models.User).filter(models.User.email.in_(whitelist_emails)).all()
        for wu in whitelisted_users:
            wu.district = "Karur"
            wu.village = "Kulithalai"
            wu.name = wu.name or "Tamil Nadu Farmer"
            wu.latitude = 10.9601 + random.uniform(-0.04, 0.04)
            wu.longitude = 78.0766 + random.uniform(-0.04, 0.04)
            wu.farm_id = wu.farm_id or f"TN-KAR-{1000 + wu.id}"
            wu.farm_name = wu.farm_name or "Green Delta Farm"
            wu.farm_size_acres = wu.farm_size_acres or 4.5
        db.commit()

        print("[*] Seeding Tamil Nadu registered farms across all 38 districts...")

        # We will create farms across all 38 districts
        # Some districts have 2-3 farms, Karur/Coimbatore/Thanjavur/Madurai have more
        farm_records = []
        farm_counter = 101

        now = datetime.datetime.utcnow()

        # Iterate over all 38 districts to ensure every single district has monitored farms
        for idx, dist_meta in enumerate(TAMIL_NADU_DISTRICTS):
            district_name = dist_meta["name"]
            villages = TN_DISTRICT_VILLAGES.get(district_name, ["Main Village", "North Village"])
            
            # Determine number of farms for this district
            # Core agricultural zones have 2-3 farms, others have 1-2
            num_farms = 2
            if district_name in ["Karur", "Coimbatore", "Thanjavur", "Madurai", "Erode", "Tiruchirappalli"]:
                num_farms = 3

            for f_idx in range(num_farms):
                farmer_name, email_prefix = TAMIL_FARMER_NAMES[(idx + f_idx * 7) % len(TAMIL_FARMER_NAMES)]
                email = f"{email_prefix.split('@')[0]}.{district_name.lower()[:3]}@tnagro.in"
                village = villages[f_idx % len(villages)]
                
                # Check if this user already exists
                farmer = db.query(models.User).filter(models.User.email == email).first()
                if not farmer:
                    # Realistic coordinates within district envelope (+- 0.035 to 0.08 degrees)
                    # For district #38 (Virudhunagar) farm #2 and Perambalur farm #2, set lat/lng=None to test 'Location Not Available'
                    is_unlocated = (district_name == "Perambalur" and f_idx == 1) or (district_name == "Tenkasi" and f_idx == 1)
                    
                    lat = None if is_unlocated else round(dist_meta["lat"] + random.uniform(-0.045, 0.045), 5)
                    lng = None if is_unlocated else round(dist_meta["lng"] + random.uniform(-0.045, 0.045), 5)

                    farm_id = f"TN-{district_name[:3].upper()}-{farm_counter}"
                    farm_counter += 1

                    farmer = models.User(
                        email=email,
                        password_hash=get_password_hash("farmer123"),
                        role="farmer",
                        name=f"{farmer_name} ({district_name})",
                        phone=f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
                        district=district_name,
                        village=village,
                        farm_id=farm_id,
                        farm_name=f"{village} Organic Farm",
                        latitude=lat,
                        longitude=lng,
                        farm_size_acres=round(random.uniform(2.5, 18.0), 1)
                    )
                    db.add(farmer)
                    db.flush()

                farm_records.append((farmer, district_name, village, idx, f_idx))

        db.commit()
        print(f"[*] Successfully ensured {len(farm_records)} Tamil Nadu farms across 38 districts.")

        # Assign Devices & Realistic Telemetry Readings to each farm
        print("[*] Generating calibrated sensor readings and alerts according to ICAR/TNAU standards...")
        
        # Clear existing alerts
        db.query(models.Alert).delete()
        db.commit()

        for farmer, district_name, village, idx, f_idx in farm_records:
            # Check or create device
            dev = db.query(models.Device).filter(models.Device.owner_id == farmer.id).first()
            if not dev:
                dev = models.Device(
                    owner_id=farmer.id,
                    api_key=f"tn_esp32_{farmer.id}_{random.randint(1000, 9999)}"
                )
                db.add(dev)
                db.flush()

            # Determine farm status scenario:
            # 65% Normal (GREEN)
            # 18% Warning (YELLOW)
            # 10% Critical (RED)
            # 7% Outdated/Insufficient data (GRAY)
            scenario_seed = (idx * 3 + f_idx) % 10
            
            # Delete old readings for this device
            db.query(models.Reading).filter(models.Reading.device_id == dev.id).delete()

            if scenario_seed == 9:
                # SCENARIO: Stale / Outdated / Insufficient data (Reading > 25 days old)
                old_ts = now - datetime.timedelta(days=random.randint(25, 45))
                reading = models.Reading(
                    device_id=dev.id,
                    timestamp=old_ts,
                    manure_type="liquid",
                    source="HARDWARE",
                    is_synthetic=False,
                    ph=6.9,
                    nitrogen_pct=1.4,
                    phosphorus_pct=0.6,
                    potassium_pct=1.1,
                    moisture_pct=65.0,
                    temperature_c=28.0,
                    organic_carbon_pct=16.0,
                    npk_index=7.4
                )
                db.add(reading)

            elif scenario_seed in [7, 8]:
                # SCENARIO: Warning (YELLOW) - one parameter out of optimal range
                # E.g. elevated pH (8.1) or lower moisture (44%)
                num_readings = 6
                for r_i in range(num_readings, -1, -1):
                    ts = now - datetime.timedelta(days=r_i * 2, hours=random.randint(1, 8))
                    warn_ph = round(random.uniform(7.9, 8.3), 2) if (r_i == 0) else round(random.uniform(6.8, 7.5), 2)
                    warn_moist = round(random.uniform(42.0, 48.0), 1) if (r_i == 0) else round(random.uniform(55.0, 68.0), 1)
                    
                    r = models.Reading(
                        device_id=dev.id,
                        timestamp=ts,
                        manure_type="liquid" if (r_i % 2 == 0) else "solid",
                        source="HARDWARE",
                        is_synthetic=False,
                        ph=warn_ph,
                        nitrogen_pct=round(random.uniform(0.9, 1.4), 2),
                        phosphorus_pct=round(random.uniform(0.4, 0.7), 2),
                        potassium_pct=round(random.uniform(0.7, 1.2), 2),
                        moisture_pct=warn_moist,
                        temperature_c=round(random.uniform(25.0, 31.0), 1),
                        organic_carbon_pct=round(random.uniform(12.0, 20.0), 1),
                        npk_index=round(random.uniform(6.0, 7.5), 1)
                    )
                    db.add(r)
                
                # Create corresponding alert for tracking
                alert = models.Alert(
                    user_id=farmer.id,
                    device_id=dev.id,
                    district=district_name,
                    village=village,
                    parameter="pH" if scenario_seed == 7 else "moisture",
                    value=8.1 if scenario_seed == 7 else 44.5,
                    threshold_type="warning",
                    message=f"pH slightly elevated (8.1) at {village} farm" if scenario_seed == 7 else f"Moisture deficit (44.5%) detected at {village} farm",
                    timestamp=now - datetime.timedelta(hours=random.randint(2, 24)),
                    is_resolved=False
                )
                db.add(alert)

            elif scenario_seed == 6:
                # SCENARIO: Critical (RED) - parameter severely abnormal
                # E.g., pH < 5.8 (acidic shock) or temperature > 42°C (severe overheating)
                num_readings = 7
                for r_i in range(num_readings, -1, -1):
                    ts = now - datetime.timedelta(days=r_i * 2, hours=random.randint(1, 8))
                    crit_ph = round(random.uniform(5.2, 5.7), 2) if (r_i == 0) else round(random.uniform(6.6, 7.2), 2)
                    crit_temp = round(random.uniform(43.0, 46.5), 1) if (r_i == 0) else round(random.uniform(26.0, 32.0), 1)

                    r = models.Reading(
                        device_id=dev.id,
                        timestamp=ts,
                        manure_type="liquid",
                        source="HARDWARE",
                        is_synthetic=False,
                        ph=crit_ph,
                        nitrogen_pct=round(random.uniform(0.3, 0.6), 2),
                        phosphorus_pct=round(random.uniform(0.2, 0.4), 2),
                        potassium_pct=round(random.uniform(0.3, 0.7), 2),
                        moisture_pct=round(random.uniform(32.0, 39.0), 1),
                        temperature_c=crit_temp,
                        organic_carbon_pct=round(random.uniform(6.0, 11.0), 1),
                        npk_index=round(random.uniform(3.5, 4.8), 1)
                    )
                    db.add(r)

                # Create Critical alert
                alert = models.Alert(
                    user_id=farmer.id,
                    device_id=dev.id,
                    district=district_name,
                    village=village,
                    parameter="pH",
                    value=5.4,
                    threshold_type="critical",
                    message=f"Critical acidic fermentation (pH 5.4) detected at {village} farm",
                    timestamp=now - datetime.timedelta(hours=random.randint(1, 12)),
                    is_resolved=False
                )
                db.add(alert)

            else:
                # SCENARIO: Normal (GREEN) - perfectly balanced organic manure
                num_readings = 8
                for r_i in range(num_readings, -1, -1):
                    ts = now - datetime.timedelta(days=r_i * 2, hours=random.randint(1, 10))
                    is_liquid = (r_i % 2 == 0)

                    r = models.Reading(
                        device_id=dev.id,
                        timestamp=ts,
                        manure_type="liquid" if is_liquid else "solid",
                        source="HARDWARE",
                        is_synthetic=False,
                        ph=round(random.uniform(6.7, 7.5), 2),
                        nitrogen_pct=round(random.uniform(1.2, 2.2), 2),
                        phosphorus_pct=round(random.uniform(0.5, 1.4), 2),
                        potassium_pct=round(random.uniform(0.9, 1.8), 2),
                        moisture_pct=round(random.uniform(58.0, 72.0), 1) if is_liquid else round(random.uniform(48.0, 62.0), 1),
                        temperature_c=round(random.uniform(24.0, 30.5), 1),
                        organic_carbon_pct=round(random.uniform(14.0, 24.0), 1),
                        npk_index=round(random.uniform(7.0, 8.8), 1)
                    )
                    db.add(r)

        db.commit()
        print("[*] Successfully seeded full Tamil Nadu geographic dataset with realistic telemetry.")

    except Exception as e:
        db.rollback()
        print(f"[!] Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_tamil_nadu_data()
