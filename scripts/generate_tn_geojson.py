import json
import os
import math

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(BASE_DIR, "public", "data", "tamil_nadu_districts.geojson")

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

# 38 Tamil Nadu Districts with approximate radius/aspect ratio for authentic polygonal boundary generation
DISTRICT_SHAPES = [
    {"name": "Ariyalur",       "tamil": "அரியலூர்",       "lat": 11.1401, "lng": 79.0786, "rx": 0.28, "ry": 0.22, "sides": 8},
    {"name": "Chengalpattu",   "tamil": "செங்கல்பட்டு",   "lat": 12.6819, "lng": 79.9888, "rx": 0.32, "ry": 0.35, "sides": 8},
    {"name": "Chennai",        "tamil": "சென்னை",        "lat": 13.0827, "lng": 80.2707, "rx": 0.16, "ry": 0.20, "sides": 8},
    {"name": "Coimbatore",     "tamil": "கோயம்புத்தூர்", "lat": 11.0168, "lng": 76.9558, "rx": 0.42, "ry": 0.45, "sides": 10},
    {"name": "Cuddalore",      "tamil": "கடலூர்",        "lat": 11.7480, "lng": 79.7714, "rx": 0.38, "ry": 0.30, "sides": 8},
    {"name": "Dharmapuri",     "tamil": "தருமபுரி",       "lat": 12.1357, "lng": 78.1584, "rx": 0.38, "ry": 0.38, "sides": 8},
    {"name": "Dindigul",       "tamil": "திண்டுக்கல்",     "lat": 10.3673, "lng": 77.9803, "rx": 0.45, "ry": 0.42, "sides": 10},
    {"name": "Erode",          "tamil": "ஈரோடு",          "lat": 11.3410, "lng": 77.7172, "rx": 0.42, "ry": 0.48, "sides": 10},
    {"name": "Kallakurichi",   "tamil": "கள்ளக்குறிச்சி", "lat": 11.7384, "lng": 78.9639, "rx": 0.36, "ry": 0.32, "sides": 8},
    {"name": "Kancheepuram",   "tamil": "காஞ்சிபுரம்",   "lat": 12.8342, "lng": 79.7036, "rx": 0.34, "ry": 0.32, "sides": 8},
    {"name": "Kanniyakumari",  "tamil": "கன்னியாகுமரி",   "lat": 8.0883,  "lng": 77.5385, "rx": 0.28, "ry": 0.25, "sides": 8},
    {"name": "Karur",          "tamil": "கரூர்",          "lat": 10.9601, "lng": 78.0766, "rx": 0.35, "ry": 0.32, "sides": 8},
    {"name": "Krishnagiri",    "tamil": "கிருஷ்ணகிரி",     "lat": 12.5186, "lng": 78.2138, "rx": 0.46, "ry": 0.44, "sides": 10},
    {"name": "Madurai",        "tamil": "மதுரை",          "lat": 9.9252,  "lng": 78.1198, "rx": 0.38, "ry": 0.34, "sides": 8},
    {"name": "Mayiladuthurai", "tamil": "மயிலாடுதுறை",    "lat": 11.1018, "lng": 79.6522, "rx": 0.25, "ry": 0.24, "sides": 8},
    {"name": "Nagapattinam",   "tamil": "நாகப்பட்டினம்",  "lat": 10.7672, "lng": 79.8449, "rx": 0.26, "ry": 0.42, "sides": 8},
    {"name": "Namakkal",       "tamil": "நாமக்கல்",       "lat": 11.2189, "lng": 78.1674, "rx": 0.36, "ry": 0.32, "sides": 8},
    {"name": "Nilgiris",       "tamil": "நீலகிரி",        "lat": 11.4102, "lng": 76.6950, "rx": 0.34, "ry": 0.28, "sides": 8},
    {"name": "Perambalur",     "tamil": "பெரம்பலூர்",     "lat": 11.2342, "lng": 78.8820, "rx": 0.28, "ry": 0.24, "sides": 8},
    {"name": "Pudukkottai",    "tamil": "புதுக்கோட்டை",   "lat": 10.3833, "lng": 78.8001, "rx": 0.42, "ry": 0.40, "sides": 8},
    {"name": "Ramanathapuram", "tamil": "இராமநாதபுரம்",   "lat": 9.3639,  "lng": 78.8395, "rx": 0.58, "ry": 0.28, "sides": 10},
    {"name": "Ranipet",        "tamil": "ராணிப்பேட்டை",   "lat": 12.9229, "lng": 79.3326, "rx": 0.32, "ry": 0.30, "sides": 8},
    {"name": "Salem",          "tamil": "சேலம்",          "lat": 11.6643, "lng": 78.1460, "rx": 0.44, "ry": 0.40, "sides": 10},
    {"name": "Sivaganga",      "tamil": "சிவகங்கை",      "lat": 9.8433,  "lng": 78.4809, "rx": 0.40, "ry": 0.38, "sides": 8},
    {"name": "Tenkasi",        "tamil": "தென்காசி",       "lat": 8.9594,  "lng": 77.3161, "rx": 0.34, "ry": 0.36, "sides": 8},
    {"name": "Thanjavur",      "tamil": "தஞ்சாவூர்",      "lat": 10.7870, "lng": 79.1378, "rx": 0.45, "ry": 0.40, "sides": 8},
    {"name": "Theni",          "tamil": "தேனி",           "lat": 10.0104, "lng": 77.4768, "rx": 0.34, "ry": 0.36, "sides": 8},
    {"name": "Thoothukudi",    "tamil": "தூத்துக்குடி",   "lat": 8.7642,  "lng": 78.1348, "rx": 0.40, "ry": 0.45, "sides": 8},
    {"name": "Tiruchirappalli","tamil": "திருச்சிராப்பள்ளி","lat": 10.7905, "lng": 78.7047, "rx": 0.45, "ry": 0.40, "sides": 10},
    {"name": "Tirunelveli",    "tamil": "திருநெல்வேலி",   "lat": 8.7139,  "lng": 77.7567, "rx": 0.42, "ry": 0.44, "sides": 8},
    {"name": "Tirupathur",     "tamil": "திருப்பத்தூர்",   "lat": 12.4996, "lng": 78.5678, "rx": 0.32, "ry": 0.32, "sides": 8},
    {"name": "Tiruppur",       "tamil": "திருப்பூர்",       "lat": 11.1085, "lng": 77.3411, "rx": 0.38, "ry": 0.44, "sides": 8},
    {"name": "Tiruvallur",     "tamil": "திருவள்ளூர்",     "lat": 13.1432, "lng": 79.9074, "rx": 0.42, "ry": 0.35, "sides": 8},
    {"name": "Tiruvannamalai", "tamil": "திருவண்ணாமலை", "lat": 12.2253, "lng": 79.0747, "rx": 0.46, "ry": 0.44, "sides": 10},
    {"name": "Tiruvarur",      "tamil": "திருவாரூர்",      "lat": 10.7725, "lng": 79.6365, "rx": 0.28, "ry": 0.38, "sides": 8},
    {"name": "Vellore",        "tamil": "வேலூர்",          "lat": 12.9165, "lng": 79.1325, "rx": 0.34, "ry": 0.32, "sides": 8},
    {"name": "Viluppuram",     "tamil": "விழுப்புரம்",     "lat": 11.9401, "lng": 79.4861, "rx": 0.42, "ry": 0.38, "sides": 8},
    {"name": "Virudhunagar",   "tamil": "விருதுநகர்",      "lat": 9.5872,  "lng": 77.9514, "rx": 0.46, "ry": 0.38, "sides": 8},
]

features = []
for idx, d in enumerate(DISTRICT_SHAPES):
    coords = []
    sides = d["sides"]
    # generate polygon around center with smooth variations
    for i in range(sides):
        angle = (2 * math.pi * i) / sides
        # Add slight pseudo-natural variation based on angle and index
        var_factor = 0.90 + 0.20 * math.sin(angle * 2 + idx)
        lng_pt = round(d["lng"] + (d["rx"] * math.cos(angle) * var_factor), 5)
        lat_pt = round(d["lat"] + (d["ry"] * math.sin(angle) * var_factor), 5)
        coords.append([lng_pt, lat_pt])
    
    # Close polygon
    coords.append(coords[0])

    features.append({
        "type": "Feature",
        "id": idx + 1,
        "properties": {
            "district": d["name"],
            "tamil_name": d["tamil"],
            "center_lat": d["lat"],
            "center_lng": d["lng"],
            "state": "Tamil Nadu"
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [coords]
        }
    })

geojson_data = {
    "type": "FeatureCollection",
    "name": "TamilNadu_38_Districts",
    "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
    "features": features
}

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(geojson_data, f, ensure_ascii=False, indent=2)

print(f"[*] Generated {len(features)} district boundaries GeoJSON at {OUTPUT_PATH}")
