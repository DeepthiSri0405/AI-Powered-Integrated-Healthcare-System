from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from config.jwt import verify_token
from config.db import get_database
from bson.objectid import ObjectId

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
        
    user_identifier: str = payload.get("sub")
    if not user_identifier:
        raise credentials_exception
        
    db = get_database()
    # Identifier could be an ObjectId (str format) or medicalId for Citizens
    user = None
    if len(user_identifier) == 24: # might be object id
        user = await db["users"].find_one({"_id": ObjectId(user_identifier)})
    
    if not user:
        user = await db["users"].find_one({"medicalId": user_identifier})
    
    if not user:
        # One last check for email if auth used email as subject
        user = await db["users"].find_one({"email": user_identifier})
        
    if not user:
        raise credentials_exception
        
    # convert ObjectId to string to simplify pydantic and lookups later
    user["id"] = str(user["_id"])
    return user
