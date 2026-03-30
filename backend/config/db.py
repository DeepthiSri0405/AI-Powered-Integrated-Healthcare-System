from motor.motor_asyncio import AsyncIOMotorClient
from config.env import MONGO_URI, DB_NAME

client = AsyncIOMotorClient(MONGO_URI)
database = client[DB_NAME]

def get_database():
    return database
