import asyncio
from config.db import get_database
from services.hospitalService import add_hospital

# Default coordinates correspond roughly to central Hyderabad, India
async def seed_hospitals():
    db = get_database()
    
    # Optional: Clear old test data so we don't duplicate
    await db["hospitals"].delete_many({})

    mock_hospitals = [
        {
            "name": "Apollo Health City",
            "address": "Jubilee Hills, Hyderabad",
            "contactInfo": "1800-456-7890",
            "location": {"type": "Point", "coordinates": [78.4023, 17.4326]},
            "specialties": ["Cardiologist", "Neurologist", "Orthopedist"]
        },
        {
            "name": "Sunshine Super Specialty",
            "address": "Secunderabad",
            "contactInfo": "1800-111-2222",
            "location": {"type": "Point", "coordinates": [78.5081, 17.4399]},
            "specialties": ["General Physician", "Dermatologist"]
        },
        {
            "name": "Care Emergency Hospital",
            "address": "Banjara Hills",
            "contactInfo": "1800-999-0000",
            "location": {"type": "Point", "coordinates": [78.4483, 17.4156]},
            "specialties": ["Cardiologist", "Dentist", "Gastroenterologist"]
        }
    ]

    for h in mock_hospitals:
        await add_hospital(h)
    
    print(f"Successfully generated and injected {len(mock_hospitals)} dummy hospitals with precise GPS coordinates into the database!")

if __name__ == "__main__":
    asyncio.run(seed_hospitals())
