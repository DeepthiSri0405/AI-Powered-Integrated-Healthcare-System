import httpx, asyncio
async def test():
    query = """
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:10000,17.38,78.48);
    );
    out center;
    """
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("https://overpass-api.de/api/interpreter", content=query, timeout=20.0)
            print("Status HTML:", res.status_code)
            try:
                print("JSON Elements:", len(res.json().get("elements", [])))
            except:
                print("Raw Response:", res.text)
    except Exception as e:
        print("Exception:", repr(e))

asyncio.run(test())
