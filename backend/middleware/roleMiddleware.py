from fastapi import HTTPException, Depends, status
from middleware.authMiddleware import get_current_user

def role_required(allowed_roles: list):
    def role_dependency(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to perform this action"
            )
        return user
    return role_dependency
