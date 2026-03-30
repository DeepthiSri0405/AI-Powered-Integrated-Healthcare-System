import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Check if the provided string matches the hashed string
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    # Hash the string and convert bytes back to a UTF-8 string so the DB can store it properly
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
