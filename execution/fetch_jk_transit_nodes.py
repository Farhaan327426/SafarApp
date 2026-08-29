import urllib.request
import urllib.parse
import json
import os
import re

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# J&K bounding box: (south, west, north, east) -> (32.0, 73.5, 36.5, 78.5)
OVERPASS_QUERY = """[out:json][timeout:60];
(
  node["highway"="bus_stop"](32.0,73.5,36.5,78.5);
  node["amenity"="bus_station"](32.0,73.5,36.5,78.5);
  node["amenity"="taxi"](32.0,73.5,36.5,78.5);
  way["amenity"="bus_station"](32.0,73.5,36.5,78.5);
  way["amenity"="taxi"](32.0,73.5,36.5,78.5);
  node["public_transport"="platform"](32.0,73.5,36.5,78.5);
  node["public_transport"="station"](32.0,73.5,36.5,78.5);
);
out body;
>;
out skel qt;
"""

def fetch_overpass_data():
    os.makedirs(".tmp", exist_ok=True)
    cache_path = os.path.join(".tmp", "jk_overpass_raw.json")

    if os.path.exists(cache_path):
        print(f"Loading cached Overpass data from {cache_path}")
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)

    print("Querying Overpass API for J&K transit nodes...")
    data = urllib.parse.urlencode({"data": OVERPASS_QUERY}).encode("utf-8")
    req = urllib.request.Request(OVERPASS_URL, data=data, headers={"User-Agent": "SafarApp-JKTransit-Mapper/1.0"})

    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            result = json.loads(response.read().decode("utf-8"))
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
            print(f"Saved {len(result.get('elements', []))} raw elements to {cache_path}")
            return result
    except Exception as e:
        print(f"Error querying Overpass API: {e}")
        return None

def process_transit_nodes(raw_data):
    if not raw_data:
        return []

    elements = raw_data.get("elements", [])
    stands = []

    for el in elements:
        tags = el.get("tags", {})
        if not tags:
            continue

        name = tags.get("name") or tags.get("name:en") or tags.get("description")
        lat = el.get("lat") or (el.get("center", {}).get("lat") if "center" in el else None)
        lon = el.get("lon") or (el.get("center", {}).get("lon") if "center" in el else None)

        if not lat or not lon:
            continue

        amenity = tags.get("amenity", "")
        highway = tags.get("highway", "")
        taxi_type = tags.get("taxi", "")
        operator = tags.get("operator", "")
        network = tags.get("network", "")

        # Infer category and stand type
        stand_type = "bus_stop"
        if amenity == "bus_station":
            stand_type = "bus_station"
        elif amenity == "taxi" or taxi_type:
            stand_type = "taxi_stand"
            if name and ("sumo" in name.lower() or "maxi" in name.lower()):
                stand_type = "sumo_stand"
            elif name and ("auto" in name.lower() or "rickshaw" in name.lower()):
                stand_type = "auto_stand"
        elif name:
            nl = name.lower()
            if "sumo" in nl:
                stand_type = "sumo_stand"
            elif "taxi" in nl:
                stand_type = "taxi_stand"
            elif "bus" in nl or "adda" in nl:
                stand_type = "bus_station"
            elif "matador" in nl or "magic" in nl:
                stand_type = "feeder_stand"

        stands.append({
            "id": el.get("id"),
            "name": name or f"Transit Node #{el.get('id')}",
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "standType": stand_type,
            "amenity": amenity,
            "highway": highway,
            "operator": operator,
            "tags": tags
        })

    output_path = os.path.join(".tmp", "jk_transit_stands_processed.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(stands, f, indent=2)

    print(f"Processed {len(stands)} transit nodes. Saved to {output_path}")

    # Summary
    named_stands = [s for s in stands if not s["name"].startswith("Transit Node #")]
    print(f"\nTotal nodes with names: {len(named_stands)}")
    by_type = {}
    for s in named_stands:
        by_type[s["standType"]] = by_type.get(s["standType"], 0) + 1
    print("Distribution by inferred stand type:")
    for k, v in sorted(by_type.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {k}: {v}")

    print("\nSample named transit stands found:")
    for s in named_stands[:25]:
        print(f"  [{s['standType'].upper()}] {s['name']} ({s['lat']}, {s['lon']})")

    return stands

if __name__ == "__main__":
    raw = fetch_overpass_data()
    process_transit_nodes(raw)
