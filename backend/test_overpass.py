import asyncio
import httpx

async def get_overpass_hospitals(lng, lat, radius=50000):
    # Standard stable mirrors
    mirrors = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ]
    
    # Round to standard precision
    la, lo = round(float(lat), 6), round(float(lng), 6)
    
    # Single-line, bulletproof Overpass Query
    q = f'[out:json][timeout:25];(node["amenity"="hospital"](around:{radius},{la},{lo});way["amenity"="hospital"](around:{radius},{la},{lo});relation["amenity"="hospital"](around:{radius},{la},{lo}););out center 20;'
    
    print(f"📡 Testing Hospital Engine (Lat: {la}, Lng: {lo})")
    async with httpx.AsyncClient() as client:
        for m in mirrors:
            try:
                print(f"🔗 Querying: {m}")
                r = await client.post(m, data={"data": q}, timeout=25.0)
                print(f"Status: {r.status_code}")
                if r.status_code == 200:
                    data = r.json()
                    elements = data.get("elements", [])
                    print(f"✅ Success! Found {len(elements)} hospitals.")
                    for e in elements:
                        print(f" - {e.get('tags', {}).get('name', 'Unnamed')}")
                    return
            except Exception as ex:
                print(f"❌ Mirror {m} Error: {ex}")

if __name__ == "__main__":
    asyncio.run(get_overpass_hospitals(78.39, 17.54))
