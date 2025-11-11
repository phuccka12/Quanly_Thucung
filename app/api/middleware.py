from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from jose import jwt, JWTError
from fastapi import status

from app.core.config import settings
from app.crud import crud_user


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware that decodes a Bearer token (if present) and populates
    `request.state.user` with the corresponding User object or None.

    This allows route handlers and dependencies to reuse the already-fetched
    user and avoid duplicate DB lookups.
    """

    async def dispatch(self, request: Request, call_next):
        request.state.user = None
        auth: str | None = request.headers.get("authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                email: str | None = payload.get("sub")
                if email:
                    # fetch user from DB and attach to request.state
                    try:
                        user = await crud_user.get_user_by_email(email=email)
                        request.state.user = user
                    except Exception:
                        request.state.user = None
            except JWTError:
                # invalid token -> leave user as None
                request.state.user = None

        response = await call_next(request)
        return response
