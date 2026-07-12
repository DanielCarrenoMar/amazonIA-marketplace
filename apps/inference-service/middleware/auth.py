from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from core.config import settings

security = HTTPBearer()

def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the JWT token using the shared secret.
    If valid, returns the payload. Otherwise, raises a 401 HTTP exception.
    """
    token = credentials.credentials
    try:
        # NestJS uses HS256 by default. We decode using the secret key
        # verify_aud=False, verify_iss=False unless explicitly configured otherwise in NestJS
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False, "verify_iss": False}
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
