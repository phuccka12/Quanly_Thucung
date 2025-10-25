from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional
from beanie import PydanticObjectId


class ProductBase(BaseModel):
	name: str = Field(..., max_length=100)
	description: Optional[str] = None
	price: float = Field(..., gt=0)
	stock_quantity: Optional[int] = Field(0)
	category: Optional[str] = None
	image_url: Optional[str] = None


class ProductCreate(ProductBase):
	pass


class ProductUpdate(BaseModel):
	name: Optional[str] = Field(None, max_length=100)
	description: Optional[str] = None
	price: Optional[float] = Field(None, gt=0)
	stock_quantity: Optional[int] = None
	category: Optional[str] = None
	image_url: Optional[str] = None


class ProductRead(ProductBase):
	id: PydanticObjectId = Field(..., alias="_id")

	class Config:
		from_attributes = True
		populate_by_name = True

