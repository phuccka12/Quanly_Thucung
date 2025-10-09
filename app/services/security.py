from passlib.context import CryptContext
from typing import Tuple
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
# Import settings from your configuration module
from app.core.config import settings
# Use bcrypt_sha256 which pre-hashes with SHA-256 before applying bcrypt,
# avoiding bcrypt's 72-byte input limit while remaining compatible.
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def _validate_or_truncate_password(password: str) -> Tuple[str, bool]:
    """Return (password_to_hash, truncated_flag).

    bcrypt has a 72-byte limit; using bcrypt_sha256 avoids this, but we keep
    a helper in case caller wants to enforce or truncate long passwords.
    """
    # caller may choose to truncate; here we simply return original
    return password, False


def get_password_hash(password: str) -> str:
    pwd, _ = _validate_or_truncate_password(password)
    return pwd_context.hash(pwd)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password) 

# HÀM MỚI ĐỂ TẠO TOKEN
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Mặc định token hết hạn sau 60 phút
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt