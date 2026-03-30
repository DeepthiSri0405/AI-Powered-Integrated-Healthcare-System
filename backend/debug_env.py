import os
from dotenv import load_dotenv

# Try to find exactly which .env is being loaded
cwd = os.getcwd()
print(f"Current Working Directory: {cwd}")

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME")

print(f"MONGO_URI retrieved: {mongo_uri}")
print(f"DB_NAME retrieved: {db_name}")

if mongo_uri and "mongodb.net" in mongo_uri:
    print("WARNING: App is still seeing the Atlas URL!")
else:
    print("APP sees local MongoDB URL correctly.")
