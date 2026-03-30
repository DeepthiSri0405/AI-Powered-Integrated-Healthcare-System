import httpx, asyncio
async def test():
    query = """
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:10000,17.0,78.0);
    );
    out center;
    """
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("https://overpass-api.de/api/interpreter", data={"data": query})
            print("17.0, 78.0 -> elements:", len(res.json().get("elements", [])))
            
        query2 = """
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:10000,17.38,78.48);
        );
        out center;
        """
        async with httpx.AsyncClient() as client:
            res = await client.post("https://overpass-api.de/api/interpreter", data={"data": query2})
            print("17.38, 78.48 -> elements:", len(res.json().get("elements", [])))
    except Exception as e:
        print("ERROR:", e)

asyncio.run(test())
