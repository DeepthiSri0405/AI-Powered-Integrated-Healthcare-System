import asyncio
import httpx

async def test():
    url = "https://overpass-api.de/api/interpreter"
    radius = 20000
    lat, lng = 17.38, 78.48
    # Test Union Syntax
    query = f"""[out:json][timeout:25];(node["amenity"="hospital"](around:{radius},{lat},{lng});way["amenity"="hospital"](around:{radius},{lat},{lng}););out center 15;"""
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, data={"data": query}, timeout=20.0)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"Count: {len(resp.json().get('elements', []))}")
        else:
            print(resp.text)

if __name__ == "__main__":
    asyncio.run(test())
