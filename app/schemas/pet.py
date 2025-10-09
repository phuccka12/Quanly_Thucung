from pydantic import BaseModel, Field
from typing import Optional
from beanie import PydanticObjectId
from datetime import date
from app.models.pet import PetGender # <-- Import PetGender từ model

# Các trường chung của một Pet
class PetBase(BaseModel):
    name: str = Field(..., max_length=50)
    species: str = Field(..., max_length=50)
    breed: Optional[str] = Field(None, max_length=50)
    
    # --- THÊM CÁC TRƯỜNG MỚI VÀO SCHEMA ---
    gender: Optional[PetGender] = None
    date_of_birth: Optional[date] = None
    weight_kg: Optional[float] = Field(None, gt=0)
    is_neutered: bool = False
    avatar_url: Optional[str] = None
    
    owner_name: str = Field(..., max_length=100)
    owner_phone: Optional[str] = Field(None, max_length=15)

# Schema cho việc tạo mới một Pet
class PetCreate(PetBase):
    pass

# Schema cho việc trả về dữ liệu Pet
class PetRead(PetBase):
    id: PydanticObjectId = Field(..., alias="_id")

    class Config:
        from_attributes = True
        populate_by_name = True

# Schema cho việc cập nhật thông tin Pet (các trường đều optional)
class PetUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    species: Optional[str] = Field(None, max_length=50)
    breed: Optional[str] = Field(None, max_length=50)
    gender: Optional[PetGender] = None
    date_of_birth: Optional[date] = None
    weight_kg: Optional[float] = Field(None, gt=0)
    is_neutered: Optional[bool] = None
    avatar_url: Optional[str] = None
    owner_name: Optional[str] = Field(None, max_length=100)
    owner_phone: Optional[str] = Field(None, max_length=15)