from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import date
from enum import Enum # <-- Import thêm Enum

# Định nghĩa Enum cho giới tính
class PetGender(str, Enum):
    MALE = "male"
    FEMALE = "female"

class Pet(Document):
    name: str = Field(..., max_length=50)
    species: str = Field(..., max_length=50)
    breed: Optional[str] = Field(None, max_length=50)
    
    # --- CÁC TRƯỜNG MỚI ---
    gender: Optional[PetGender] = None # Giới tính
    date_of_birth: Optional[date] = None # Ngày sinh
    weight_kg: Optional[float] = Field(None, gt=0) # Cân nặng (kg)
    is_neutered: bool = Field(default=False) # Mặc định là chưa triệt sản
    avatar_url: Optional[str] = Field(None) # URL ảnh
    image_url: Optional[str] = Field(None) # URL ảnh (thêm để tương thích với frontend)
    
    # Thông tin của chủ sở hữu
    owner_name: str = Field(..., max_length=100)
    owner_email: Optional[str] = Field(None, max_length=100)
    owner_phone: Optional[str] = Field(None, max_length=15)
    
    class Settings:
        name = "pets"