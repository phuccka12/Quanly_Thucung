from beanie import Document
from pydantic import Field
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class CartItem(BaseModel):
    product_id: str
    name: Optional[str] = None
    unit_price: Optional[float] = None
    quantity: int = 1
    stock_snapshot: Optional[int] = None


class Cart(Document):
    user_id: str
    items: List[CartItem] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "carts"
