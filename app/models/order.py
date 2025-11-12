from __future__ import annotations

from beanie import Document
from pydantic import Field, BaseModel
from typing import List, Optional
from datetime import datetime


class OrderItem(BaseModel):
    product_id: str
    name: str
    unit_price: float
    quantity: int
    subtotal: float


class ShippingInfo(BaseModel):
    name: str
    address: str
    phone: Optional[str] = None


class OrderStatus(str):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    CANCELLED = "cancelled"


class Order(Document):
    # Snapshot of user info for easier queries (portal uses email)
    user_email: str
    user_name: Optional[str] = None

    items: List[OrderItem]
    shipping: ShippingInfo

    total: float
    status: str = Field(default=OrderStatus.PENDING)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "orders"
