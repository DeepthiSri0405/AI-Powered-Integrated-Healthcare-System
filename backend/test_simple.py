import asyncio
import httpx

async def test():
    url = "https://overpass-api.de/api/interpreter"
    # Simplest possible query for a known hospital area (Hyderabad)
    query = """[out:json][timeout:25];node["amenity"="hospital"](around:5000,17.38,78.48);out;"""
    async with httpx.AsyncClient() as client:
        # Overpass expects 'data' as a form parameter
        resp = await client.post(url, data={"data": query}, timeout=20.0)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print(f"Count: {len(resp.json().get('elements', []))}")
        else:
            print(resp.text)

if __name__ == "__main__":
    asyncio.run(test())
