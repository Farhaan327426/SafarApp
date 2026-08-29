import json
import os

DISTRICT_BOUNDS = {
    "Srinagar": {"lat": (33.98, 34.18), "lon": (74.72, 74.95)},
    "Budgam": {"lat": (33.85, 34.10), "lon": (74.55, 74.80)},
    "Baramulla": {"lat": (34.10, 34.45), "lon": (74.15, 74.65)},
    "Bandipora": {"lat": (34.35, 34.70), "lon": (74.50, 74.90)},
    "Ganderbal": {"lat": (34.15, 34.45), "lon": (74.75, 75.35)},
    "Anantnag": {"lat": (33.60, 33.85), "lon": (75.05, 75.40)},
    "Pulwama": {"lat": (33.78, 34.00), "lon": (74.80, 75.10)},
    "Shopian": {"lat": (33.65, 33.85), "lon": (74.75, 75.00)},
    "Kulgam": {"lat": (33.55, 33.75), "lon": (74.85, 75.15)},
    "Kupwara": {"lat": (34.35, 34.70), "lon": (73.90, 74.45)},
    "Jammu": {"lat": (32.60, 32.85), "lon": (74.75, 75.00)},
    "Reasi": {"lat": (32.95, 33.20), "lon": (74.70, 75.00)},
    "Udhampur": {"lat": (32.85, 33.10), "lon": (75.05, 75.30)},
    "Kathua": {"lat": (32.30, 32.60), "lon": (75.40, 75.60)},
    "Samba": {"lat": (32.50, 32.65), "lon": (75.05, 75.25)},
    "Rajouri": {"lat": (33.30, 33.50), "lon": (74.20, 74.45)},
    "Poonch": {"lat": (33.65, 33.85), "lon": (74.00, 74.25)},
    "Ramban": {"lat": (33.20, 33.40), "lon": (75.15, 75.35)},
    "Doda": {"lat": (33.05, 33.25), "lon": (75.45, 75.65)},
    "Kishtwar": {"lat": (33.25, 33.45), "lon": (75.65, 75.85)},
}

def assign_district(lat, lon):
    for dist, b in DISTRICT_BOUNDS.items():
        if b["lat"][0] <= lat <= b["lat"][1] and b["lon"][0] <= lon <= b["lon"][1]:
            return dist
    return "Other J&K"

def analyze():
    input_path = os.path.join(".tmp", "jk_transit_stands_processed.json")
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        stands = json.load(f)

    district_stands = {}
    for s in stands:
        if s["name"].startswith("Transit Node #"):
            continue
        dist = assign_district(s["lat"], s["lon"])
        if dist not in district_stands:
            district_stands[dist] = []
        district_stands[dist].append(s)

    print("=== J&K Ground-Truth Transit Stands by District ===")
    for dist, nodes in sorted(district_stands.items(), key=lambda x: len(x[1]), reverse=True):
        print(f"\n[District] {dist} ({len(nodes)} named stands/stops)")
        for n in nodes[:8]:
            print(f"   * [{n['standType']}] {n['name']} ({n['lat']}, {n['lon']})")

    # Output structured summary
    out_path = os.path.join(".tmp", "district_transit_summary.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(district_stands, f, indent=2)
    print(f"\nSaved structured district transit stands to {out_path}")

if __name__ == "__main__":
    analyze()
