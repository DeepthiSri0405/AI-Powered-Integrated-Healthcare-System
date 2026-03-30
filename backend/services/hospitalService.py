from config.db import get_database
import pymongo
import httpx
import math

async def setup_hospital_indexes():
    db = get_database()
    await db["hospitals"].create_index([("location", pymongo.GEOSPHERE)])

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371 # km
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

async def get_overpass_hospitals(lng: float, lat: float, max_distance_meters: int = 50000):
    mirrors = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ]
    
    radius = min(max_distance_meters, 50000)
    c_lat, c_lng = round(float(lat), 6), round(float(lng), 6)
    
    # 📡 Final Bulletproof Query
    query = f'[out:json][timeout:25];(node["amenity"="hospital"](around:{radius},{c_lat},{c_lng});way["amenity"="hospital"](around:{radius},{c_lat},{c_lng});relation["amenity"="hospital"](around:{radius},{c_lat},{c_lng});node["amenity"="clinic"](around:{radius},{c_lat},{c_lng});way["amenity"="clinic"](around:{radius},{c_lat},{c_lng}););out center 25;'

    async with httpx.AsyncClient() as client:
        for url in mirrors:
            try:
                print(f"📡 Querying Global Engine: {url} (Radius: {radius}m)")
                response = await client.post(url, data={"data": query}, timeout=25.0)
                
                if response.status_code != 200:
                    print(f"⚠️ Mirror {url} returned {response.status_code}")
                    continue

                data = response.json()
                real_hospitals = []
                
                for element in data.get("elements", []):
                    tags = element.get("tags", {})
                    name = tags.get("name", tags.get("description", "Healthcare Facility"))
                    
                    if element.get("type") == "node":
                        real_lat, real_lon = element.get("lat"), element.get("lon")
                    else:
                        center = element.get("center", {})
                        real_lat, real_lon = center.get("lat"), center.get("lon")
                        
                    if not real_lat or not real_lon:
                        continue
                    
                    real_hospitals.append({
                        "id": f"osm_{element.get('id')}", 
                        "name": name,
                        "address": tags.get("addr:street", tags.get("addr:city", "Nearby Healthcare")),
                        "contactInfo": tags.get("phone", "Booking via Health App"),
                        "location": {"type": "Point", "coordinates": [real_lon, real_lat]},
                        "specialties": ["General Physician", "Pediatrician"], 
                        "source": "OpenStreetMap"
                    })
                return real_hospitals
            except Exception as e:
                print(f"⚠️ Mirror {url} Error: {e}")
                continue
        
        print("❌ All Overpass mirrors failed.")
        return []

async def get_nearby_hospitals(longitude: float, latitude: float, max_distance_meters: int = 50000):
    db = get_database()
    query = {
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [longitude, latitude]},
                "$maxDistance": max_distance_meters
            }
        }
    }
    
    db_hospitals = await db["hospitals"].find(query).to_list(100)
    real_hospitals = await get_overpass_hospitals(longitude, latitude, max_distance_meters)
    
    final_hospitals, seen_names = [], set()

    for h in real_hospitals:
        if h["name"] not in seen_names:
            h_lon, h_lat = h["location"]["coordinates"]
            h["distance_km"] = round(calculate_distance(latitude, longitude, h_lat, h_lon), 2)
            final_hospitals.append(h)
            seen_names.add(h["name"])

    for h in db_hospitals:
        h["id"] = str(h["_id"])
        h["source"] = "Database"
        del h["_id"]
        if h["name"] not in seen_names:
            h_lon, h_lat = h["location"]["coordinates"]
            h["distance_km"] = round(calculate_distance(latitude, longitude, h_lat, h_lon), 2)
            final_hospitals.append(h)
            seen_names.add(h["name"])
    
    final_hospitals.sort(key=lambda x: x["distance_km"])
    return final_hospitals[:20]
async def add_hospital(hospital_data: dict):
    db = get_database()
    await setup_hospital_indexes()
    result = await db["hospitals"].insert_one(hospital_data)
    hospital_data["id"] = str(result.inserted_id)
    del hospital_data["_id"]
    return hospital_data

async def get_nearby_labs(lng: float, lat: float, max_distance_meters: int = 50000):
    """
    Specifically search for diagnostic centers and laboratories.
    """
    mirrors = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter"
    ]
    
    radius = min(max_distance_meters, 50000)
    c_lat, c_lng = round(float(lat), 6), round(float(lng), 6)
    
    # Query for laboratories, clinics, and diagnostic centers
    query = f'[out:json][timeout:25];(node["amenity"="laboratory"](around:{radius},{c_lat},{c_lng});way["amenity"="laboratory"](around:{radius},{c_lat},{c_lng});node["healthcare"="laboratory"](around:{radius},{c_lat},{c_lng});node["amenity"="clinic"]["healthcare:speciality"~"diagnostic"](around:{radius},{c_lat},{c_lng}););out center 20;'

    async with httpx.AsyncClient() as client:
        for url in mirrors:
            try:
                response = await client.post(url, data={"data": query}, timeout=25.0)
                if response.status_code != 200: continue

                data = response.json()
                labs = []
                for element in data.get("elements", []):
                    tags = element.get("tags", {})
                    name = tags.get("name", "Diagnostic Center")
                    
                    if element.get("type") == "node":
                        l_lat, l_lon = element.get("lat"), element.get("lon")
                    else:
                        center = element.get("center", {})
                        l_lat, l_lon = center.get("lat"), center.get("lon")
                    
                    labs.append({
                        "id": f"lab_{element.get('id')}",
                        "name": name,
                        "address": tags.get("addr:street", "Nearby Area"),
                        "location": {"type": "Point", "coordinates": [l_lon, l_lat]},
                        "distance_km": round(calculate_distance(lat, lng, l_lat, l_lon), 2),
                        "source": "OpenStreetMap"
                    })
                return labs
            except: continue
    return []
