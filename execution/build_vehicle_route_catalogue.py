import json
import os

VEHICLE_ROUTE_DATABASE = {
    "tata-magic": {
        "label": "Tata Magic / Feeder 4-Wheeler",
        "permitType": "stage-carriage",
        "calcType": "stage-slab",
        "operatingScope": "Semi-Urban & Rural Feeder (<20 km)",
        "dominantDistricts": ["Baramulla", "Kupwara", "Anantnag", "Kulgam", "Pulwama", "Jammu Peripheral"],
        "routes": [
            # Baramulla & Sopore Core Hub
            {"from": "Baramulla Stand", "to": "Kreeri", "distance": 14, "region": "kashmir-plain", "corridor": "Baramulla-Babareshi Rd"},
            {"from": "Baramulla Stand", "to": "Delina", "distance": 6, "region": "kashmir-plain", "corridor": "NH-1A"},
            {"from": "Baramulla Stand", "to": "Sheeri", "distance": 8, "region": "kashmir-plain", "corridor": "Jhelum Valley Rd"},
            {"from": "Baramulla Stand", "to": "Kanispora", "distance": 4, "region": "kashmir-plain", "corridor": "District Rd"},
            {"from": "Sopore Adda", "to": "Watergam", "distance": 12, "region": "kashmir-plain", "corridor": "Sopore-Kupwara Rd"},
            {"from": "Sopore Adda", "to": "Dangiwacha", "distance": 16, "region": "kashmir-plain", "corridor": "Rafiabad Corridor"},
            {"from": "Sopore Adda", "to": "Tarzoo", "distance": 5, "region": "kashmir-plain", "corridor": "Wular Ring Rd"},
            {"from": "Sopore Adda", "to": "Seelu", "distance": 4, "region": "kashmir-plain", "corridor": "NH-1A"},
            {"from": "Pattan", "to": "Palhallan", "distance": 3, "region": "kashmir-plain", "corridor": "Local Link"},
            {"from": "Pattan", "to": "Kreeri", "distance": 9, "region": "kashmir-plain", "corridor": "Inner District Rd"},
            {"from": "Pattan", "to": "Magam", "distance": 12, "region": "kashmir-plain", "corridor": "Pattan-Beerwah Rd"},
            # Kupwara Hub
            {"from": "Kupwara Town", "to": "Trehgam", "distance": 9, "region": "kashmir-plain", "corridor": "Kupwara-Chowkibal Rd"},
            {"from": "Kupwara Town", "to": "Kalaroos", "distance": 14, "region": "kashmir-plain", "corridor": "Frontier Link"},
            {"from": "Handwara", "to": "Chogal", "distance": 5, "region": "kashmir-plain", "corridor": "Handwara Bypass"},
            {"from": "Handwara", "to": "Langate", "distance": 6, "region": "kashmir-plain", "corridor": "Baramulla-Handwara Rd"},
            {"from": "Handwara", "to": "Qalamabad", "distance": 15, "region": "kashmir-plain", "corridor": "Mawar Corridor"},
            # South Kashmir Feeder
            {"from": "Anantnag Old Adda", "to": "Achabal", "distance": 9, "region": "kashmir-plain", "corridor": "Mughal Garden Rd"},
            {"from": "Anantnag Old Adda", "to": "Mattan", "distance": 8, "region": "kashmir-plain", "corridor": "Pahalgam Rd"},
            {"from": "Anantnag Old Adda", "to": "Dialgam", "distance": 5, "region": "kashmir-plain", "corridor": "Dooru Rd"},
            {"from": "Kulgam Stand", "to": "Chawalgam", "distance": 3, "region": "kashmir-plain", "corridor": "Local Link"},
            {"from": "Kulgam Stand", "to": "Devsar", "distance": 9, "region": "kashmir-plain", "corridor": "Kulgam-Qazigund Rd"},
            {"from": "Pulwama Stand", "to": "Rajpora", "distance": 8, "region": "kashmir-plain", "corridor": "Pulwama-Shopian Rd"},
            {"from": "Pulwama Stand", "to": "Pampore", "distance": 14, "region": "kashmir-plain", "corridor": "Saffron Corridor"},
            # Jammu Peripheral Feeder
            {"from": "R.S. Pura", "to": "Bishnah", "distance": 12, "region": "jammu-plain", "corridor": "Border Link Rd"},
            {"from": "R.S. Pura", "to": "Miran Sahib", "distance": 8, "region": "jammu-plain", "corridor": "Jammu-RS Pura Rd"},
            {"from": "Akhnoor Stand", "to": "Jourian", "distance": 15, "region": "jammu-plain", "corridor": "Chenab River Rd"},
        ]
    },
    "force-traveler": {
        "label": "Force Traveler (14-Seater)",
        "permitType": "contract-tourist",
        "calcType": "tourist-group",
        "operatingScope": "Primary Tourist & High-Capacity Group Corridors",
        "dominantDistricts": ["Srinagar", "Baramulla (Gulmarg)", "Anantnag (Pahalgam)", "Ganderbal (Sonamarg)", "Reasi (Katra)"],
        "routes": [
            {"from": "TRC Srinagar", "to": "Gulmarg", "distance": 51, "region": "kashmir-hill", "corridor": "Gulmarg Highway"},
            {"from": "TRC Srinagar", "to": "Pahalgam", "distance": 92, "region": "kashmir-hill", "corridor": "KP Highway via KP Road"},
            {"from": "TRC Srinagar", "to": "Sonamarg", "distance": 80, "region": "kashmir-hill", "corridor": "NH-1D Leh Highway"},
            {"from": "TRC Srinagar", "to": "Doodhpathri", "distance": 42, "region": "kashmir-hill", "corridor": "Budgam-Khan Sahib Rd"},
            {"from": "Srinagar Airport", "to": "Gulmarg", "distance": 56, "region": "kashmir-hill", "corridor": "Airport Bypass-Tangmarg"},
            {"from": "Srinagar Airport", "to": "Pahalgam", "distance": 90, "region": "kashmir-hill", "corridor": "Airport-NH44-KP Road"},
            {"from": "Srinagar Airport", "to": "Sonamarg", "distance": 88, "region": "kashmir-hill", "corridor": "Ganderbal Bypass"},
            {"from": "Katra Central Stand", "to": "Jammu Tawi Station", "distance": 48, "region": "jammu-hill", "corridor": "NH-144 Expressway"},
            {"from": "Katra Central Stand", "to": "Shiv Khori (Ransoo)", "distance": 74, "region": "jammu-hill", "corridor": "Reasi-Pouni Highway"},
            {"from": "Katra Central Stand", "to": "Patnitop", "distance": 85, "region": "jammu-hill", "corridor": "NH-44 Chenani Tunnel"},
            {"from": "Parimpora Stand", "to": "Uri Border", "distance": 98, "region": "kashmir-hill", "corridor": "Jhelum Valley Highway"},
            {"from": "Parimpora Stand", "to": "Kupwara", "distance": 78, "region": "kashmir-plain", "corridor": "NH-701 Highway"},
            {"from": "Jammu GBS", "to": "Katra", "distance": 48, "region": "jammu-plain", "corridor": "NH-144"},
            {"from": "TRC Srinagar", "to": "Baltal (Amarnath Base)", "distance": 94, "region": "kashmir-hill", "corridor": "NH-1D Baltal Axis"},
            {"from": "TRC Srinagar", "to": "Nunwan (Pahalgam Base)", "distance": 90, "region": "kashmir-hill", "corridor": "Yatra Highway"},
        ]
    },
    "vikram-tempo": {
        "label": "Vikram / Safa Tempo (Jammu Urban)",
        "permitType": "stage-carriage",
        "calcType": "urban-stage",
        "operatingScope": "Jammu City Fixed-Route Urban Shared Transit",
        "dominantDistricts": ["Jammu Urban"],
        "routes": [
            {"from": "Jammu Old City (Shalamar)", "to": "Satwari Chowk", "distance": 6, "region": "jammu-plain", "corridor": "Tawi Bridge-Airport Rd"},
            {"from": "Jewel Chowk", "to": "Talab Tillo", "distance": 5, "region": "jammu-plain", "corridor": "Talab Tillo Main Rd"},
            {"from": "Jewel Chowk", "to": "Canal Road (University)", "distance": 3, "region": "jammu-plain", "corridor": "Canal Rd"},
            {"from": "Jewel Chowk", "to": "Janipur (High Court)", "distance": 7, "region": "jammu-plain", "corridor": "Amphalla-Janipur Rd"},
            {"from": "Jammu Bus Stand", "to": "Gandhi Nagar (Gole Market)", "distance": 4, "region": "jammu-plain", "corridor": "Bikram Chowk Rd"},
            {"from": "Jammu Bus Stand", "to": "Bari Brahmana", "distance": 14, "region": "jammu-plain", "corridor": "Industrial NH-44"},
            {"from": "Satwari Chowk", "to": "Chatha (SKUAST)", "distance": 6, "region": "jammu-plain", "corridor": "Main Chatha Rd"},
            {"from": "Satwari Chowk", "to": "Miran Sahib", "distance": 10, "region": "jammu-plain", "corridor": "RS Pura Highway"},
            {"from": "Bikram Chowk", "to": "Bahu Fort", "distance": 4, "region": "jammu-plain", "corridor": "Bahu Link Rd"},
            {"from": "Panjtirthi", "to": "Sidhra (Golf Course)", "distance": 7, "region": "jammu-plain", "corridor": "Sidhra Bridge Corridor"},
        ]
    },
    "mini-bus-matador": {
        "label": "Mini Bus / Matador (Tata 407 / Swaraj)",
        "permitType": "stage-carriage",
        "calcType": "stage-carriage",
        "operatingScope": "High-Frequency Intra-District Stage Network (All 20 Districts)",
        "dominantDistricts": ["Universal across all 20 J&K Districts"],
        "routes": [
            {"from": "Batamaloo / Lal Chowk", "to": "Soura (SKIMS)", "distance": 9, "region": "kashmir-plain", "corridor": "Ali Jan Road"},
            {"from": "Lal Chowk", "to": "Hazratbal Dargah", "distance": 11, "region": "kashmir-plain", "corridor": "Boulevard / Nigeen"},
            {"from": "Lal Chowk", "to": "Pantha Chowk", "distance": 8, "region": "kashmir-plain", "corridor": "NH-44 Bypass"},
            {"from": "Parimpora Stand", "to": "Lal Chowk", "distance": 7, "region": "kashmir-plain", "corridor": "Qamarwari Axis"},
            {"from": "Batamaloo", "to": "Chadoora", "distance": 15, "region": "kashmir-plain", "corridor": "Budgam-Chadoora Rd"},
            {"from": "Chadoora", "to": "Charar-i-Sharief", "distance": 16, "region": "kashmir-hill", "corridor": "Shrine Hill Highway"},
            {"from": "Batamaloo", "to": "Beerwah", "distance": 28, "region": "kashmir-plain", "corridor": "Magam-Beerwah Rd"},
            {"from": "Parimpora", "to": "Pattan", "distance": 22, "region": "kashmir-plain", "corridor": "NH-1A Highway"},
            {"from": "Pattan", "to": "Baramulla Town", "distance": 26, "region": "kashmir-plain", "corridor": "NH-1A Highway"},
            {"from": "Baramulla Town", "to": "Sopore Adda", "distance": 16, "region": "kashmir-plain", "corridor": "Tarzoo-Sopore Axis"},
            {"from": "Anantnag Old Adda", "to": "Bijbehara", "distance": 8, "region": "kashmir-plain", "corridor": "NH-44 Corridor"},
            {"from": "Anantnag Old Adda", "to": "Qazigund", "distance": 20, "region": "kashmir-plain", "corridor": "Old NH-44"},
            {"from": "Jammu GBS", "to": "Bari Brahmana", "distance": 14, "region": "jammu-plain", "corridor": "NH-44 South"},
            {"from": "Jammu GBS", "to": "Akhnoor", "distance": 28, "region": "jammu-plain", "corridor": "Jammu-Poonch Highway"},
            {"from": "Jammu GBS", "to": "Nagrota", "distance": 14, "region": "jammu-hill", "corridor": "NH-44 Bypass"},
            {"from": "Nagrota", "to": "Udhampur", "distance": 52, "region": "jammu-hill", "corridor": "NH-44 Expressway"},
        ]
    },
    "shared-cab": {
        "label": "Shared Maxi-Cab (Tata Sumo / Bolero / Tavera)",
        "permitType": "shared-maxi-cab",
        "calcType": "shared-cab",
        "operatingScope": "Inter-District, Tehsil Hubs & Mountain Passes",
        "dominantDistricts": ["Universal across all 20 J&K Districts"],
        "routes": [
            {"from": "Parimpora Stand", "to": "Baramulla", "distance": 48, "region": "kashmir-plain", "corridor": "NH-1A"},
            {"from": "Parimpora Stand", "to": "Sopore", "distance": 45, "region": "kashmir-plain", "corridor": "Sopore Highway"},
            {"from": "Parimpora Stand", "to": "Kupwara", "distance": 78, "region": "kashmir-plain", "corridor": "NH-701"},
            {"from": "Parimpora Stand", "to": "Handwara", "distance": 68, "region": "kashmir-plain", "corridor": "NH-701"},
            {"from": "Parimpora Stand", "to": "Uri (Line of Control)", "distance": 98, "region": "kashmir-hill", "corridor": "Jhelum Valley Rd"},
            {"from": "Parimpora Stand", "to": "Bandipora", "distance": 52, "region": "kashmir-plain", "corridor": "Wular Lake Highway"},
            {"from": "Pantha Chowk", "to": "Anantnag", "distance": 48, "region": "kashmir-plain", "corridor": "NH-44 Four-Lane"},
            {"from": "Pantha Chowk", "to": "Kulgam", "distance": 64, "region": "kashmir-plain", "corridor": "NH-44 / Kulgam Link"},
            {"from": "Pantha Chowk", "to": "Shopian", "distance": 46, "region": "kashmir-plain", "corridor": "Pulwama-Shopian Rd"},
            {"from": "Pantha Chowk", "to": "Banihal", "distance": 105, "region": "kashmir-hill", "corridor": "NH-44 Qazigund Tunnel"},
            {"from": "TRC / Pantha Chowk", "to": "Jammu GBS", "distance": 260, "region": "jammu-hill", "corridor": "NH-44 Expressway"},
            {"from": "Jammu GBS", "to": "Doda", "distance": 165, "region": "jammu-hill", "corridor": "Batote-Kishtwar NH-244"},
            {"from": "Jammu GBS", "to": "Kishtwar", "distance": 215, "region": "jammu-hill", "corridor": "NH-244 Chenab Valley"},
            {"from": "Jammu GBS", "to": "Rajouri", "distance": 150, "region": "jammu-hill", "corridor": "NH-144A Border Highway"},
            {"from": "Jammu GBS", "to": "Poonch", "distance": 235, "region": "jammu-hill", "corridor": "NH-144A Line of Control"},
            {"from": "Jammu GBS", "to": "Katra (SMVD)", "distance": 48, "region": "jammu-plain", "corridor": "NH-144"},
            {"from": "Jammu GBS", "to": "Kathua", "distance": 82, "region": "jammu-plain", "corridor": "NH-44 South"},
        ]
    },
    "e-rickshaw": {
        "label": "E-Rickshaw (4-Seater Last-Mile)",
        "permitType": "municipal-feeder",
        "calcType": "e-rickshaw",
        "operatingScope": "Hyper-Local Municipal Feeder & Intra-City (1–6 km)",
        "dominantDistricts": ["Srinagar Urban", "Jammu Urban", "Katra Town", "Baramulla Town", "Anantnag Town"],
        "routes": [
            {"from": "Lal Chowk", "to": "Dalgate (Ghat 1)", "distance": 2.5, "region": "kashmir-plain", "corridor": "MA Road"},
            {"from": "Lal Chowk", "to": "Karan Nagar", "distance": 3.0, "region": "kashmir-plain", "corridor": "SMHS Hospital Corridor"},
            {"from": "Lal Chowk", "to": "Batamaloo Stand", "distance": 2.2, "region": "kashmir-plain", "corridor": "Iqbal Park Link"},
            {"from": "Hazratbal Dargah", "to": "Habak Crossing", "distance": 2.0, "region": "kashmir-plain", "corridor": "University Campus Rd"},
            {"from": "Soura (SKIMS)", "to": "Buchpora", "distance": 2.5, "region": "kashmir-plain", "corridor": "90 Feet Rd"},
            {"from": "Jammu Railway Station", "to": "Bahu Plaza", "distance": 2.0, "region": "jammu-plain", "corridor": "Railhead Complex"},
            {"from": "Jewel Chowk", "to": "Dogra Chowk", "distance": 1.5, "region": "jammu-plain", "corridor": "Main City Axis"},
            {"from": "Katra Bus Stand", "to": "Banganga Yatra Checkpost", "distance": 2.5, "region": "jammu-hill", "corridor": "Banganga Road"},
            {"from": "Katra Bus Stand", "to": "Katra Railway Station", "distance": 2.0, "region": "jammu-hill", "corridor": "Station Link Rd"},
            {"from": "Baramulla General Adda", "to": "GMC Baramulla (Kantbagh)", "distance": 2.5, "region": "kashmir-plain", "corridor": "Hospital Rd"},
            {"from": "Anantnag Old Adda", "to": "GMC Dialgam Anantnag", "distance": 3.5, "region": "kashmir-plain", "corridor": "Dialgam Link"},
        ]
    }
}

def analyze_and_export():
    os.makedirs(".tmp", exist_ok=True)
    out_path = os.path.join(".tmp", "vehicle_route_matrix.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(VEHICLE_ROUTE_DATABASE, f, indent=2)

    print("=== Specialized Vehicle-by-Vehicle J&K Route Catalogue ===")
    total_routes = 0
    for vkey, vdata in VEHICLE_ROUTE_DATABASE.items():
        rcount = len(vdata["routes"])
        total_routes += rcount
        print(f"\n[Vehicle: {vdata['label']}] ({vdata['permitType']})")
        print(f"  * Operating Scope: {vdata['operatingScope']}")
        print(f"  * Dominant Districts: {', '.join(vdata['dominantDistricts'])}")
        print(f"  * Verified Specific Routes Catalogued: {rcount}")
        for r in vdata["routes"][:3]:
            print(f"    - {r['from']} -> {r['to']} ({r['distance']} km) [{r['corridor']}]")
    print(f"\nTotal Specialized Direct O-D Corridors: {total_routes}")

if __name__ == "__main__":
    analyze_and_export()
