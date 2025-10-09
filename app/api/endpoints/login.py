from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Any

from app.services import security
from app.crud import crud_user
from app.schemas.token import Token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    Cung cấp access token cho việc đăng nhập.
    """
    # 1. Dùng email (form_data.username) để tìm user trong DB
    user = await crud_user.get_user_by_email(email=form_data.username)

    # 2. Nếu user không tồn tại HOẶC mật khẩu sai -> báo lỗi
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Nếu xác thực thành công, tạo access token
    access_token_data = {"sub": user.email}
    access_token = security.create_access_token(data=access_token_data)
    
    # 4. Trả về token
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }