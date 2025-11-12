from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from app.schemas.user import UserCreate, UserRead, UserUpdate, AdminUserUpdate  # Schemas từ thư mục schemas
from app.models.user import User                   # Model từ thư mục models
from app.crud import crud_user                     # CRUD functions từ thư mục crud
from app.api.deps import get_current_user, get_current_admin_user # Dependency từ file deps
from app.services.security import get_password_hash
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
from beanie import PydanticObjectId
router = APIRouter()
@router.post("/register", response_model=UserRead)
async def register_new_user(user_in: UserCreate):
    """
    Tạo người dùng mới.
    """
    try:
        created_user = await crud_user.create_user(user_in=user_in)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    return created_user

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Lấy thông tin của người dùng hiện tại đang đăng nhập.
    """
    return current_user


@router.put("/me", response_model=UserRead)
async def update_users_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật thông tin profile của người dùng hiện tại.
    """
    # Update fields if provided
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.password:
        current_user.hashed_password = get_password_hash(user_in.password)
    if getattr(user_in, 'avatar_url', None) is not None:
        current_user.avatar_url = user_in.avatar_url

    await current_user.save()

    return current_user


# ---------------------- Admin endpoints ----------------------


@router.get("/", response_model=List[UserRead])
async def list_users(skip: int = 0, limit: int = 50, search: Optional[str] = None, current_user: User = Depends(get_current_admin_user)):
    """List users for admin (paginated)."""
    if search:
        q = {"$or": [{"email": {"$regex": search, "$options": "i"}}, {"full_name": {"$regex": search, "$options": "i"}}]}
        users = await User.find(q).skip(skip).limit(limit).to_list()
    else:
        users = await User.find_all().skip(skip).limit(limit).to_list()
    return users


@router.get("/{user_id}", response_model=UserRead)
async def get_user_by_id(user_id: PydanticObjectId, current_user: User = Depends(get_current_admin_user)):
    u = await User.get(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.put("/{user_id}", response_model=UserRead)
async def admin_update_user(user_id: PydanticObjectId, user_in: AdminUserUpdate, current_user: User = Depends(get_current_admin_user)):
    u = await User.get(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    data = user_in.dict(exclude_unset=True)
    if 'full_name' in data:
        u.full_name = data['full_name']
    if 'password' in data and data.get('password'):
        u.hashed_password = get_password_hash(data['password'])
    if 'avatar_url' in data:
        u.avatar_url = data.get('avatar_url')
    if 'role' in data and data.get('role') is not None:
        u.role = data.get('role')
    if 'is_active' in data and data.get('is_active') is not None:
        u.is_active = data.get('is_active')
    await u.save()
    return u


@router.delete("/{user_id}")
async def admin_delete_user(user_id: PydanticObjectId, current_user: User = Depends(get_current_admin_user)):
    u = await User.get(user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    await u.delete()
    return {"ok": True}