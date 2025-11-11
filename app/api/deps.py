from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.core.config import settings
from app.models.user import User, UserRole
from app.crud import crud_user

# Định nghĩa scheme để lấy token từ header, trỏ tới URL đăng nhập của chúng ta
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/login")


async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)) -> User:
    """
    Dependency that returns the current user. First tries to read
    `request.state.user` populated by the AuthMiddleware to avoid duplicate DB
    lookups. If not present, falls back to decoding the token and fetching
    the user from the DB (backwards compatible).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Prefer middleware-populated user
    if hasattr(request.state, "user") and request.state.user is not None:
        return request.state.user

    try:
        # Giải mã token để lấy payload
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Dùng email lấy được để tìm user trong DB
    user = await crud_user.get_user_by_email(email=email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency để kiểm tra xem người dùng có phải là Admin không.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user