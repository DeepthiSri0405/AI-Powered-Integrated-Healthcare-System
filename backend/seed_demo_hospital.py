import asyncio
from config.db import get_database

async def seed():
    db = get_database()
    # Create the specialized Demo hospital for the presentation
    demo_hospital = {
        "name": "🏥 SmartHealth Hub (Demo Hospital)",
        "address": "Hi-Tech City, Hyderabad",
        "contactInfo": "+91 99999-00000",
        "location": {
            "type": "Point",
            "coordinates": [78.39, 17.54] # Matches our default nearby location
        },
        "specialties": ["Cardiology", "Neurology", "General Physician"],
        "isDemo": True,
        "source": "Database"
    }

    # Remove duplicates before seeding
    await db["hospitals"].delete_many({"name": demo_hospital["name"]})
    await db["hospitals"].insert_one(demo_hospital)
    print(f"Successfully seeded: {demo_hospital['name']}")

if __name__ == "__main__":
    asyncio.run(seed())
