# /app/models/product.py
from beanie import Document
from pydantic import Field
from typing import Optional

class Product(Document):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0) # Giá bán, phải lớn hơn 0
    stock_quantity: int = Field(default=0) # Số lượng tồn kho
    category: Optional[str] = None # Danh mục sản phẩm
    image_url: Optional[str] = Field(None) # URL ảnh sản phẩm

    class Settings:
        name = "products"