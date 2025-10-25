from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from beanie import PydanticObjectId

from app.schemas.product import ProductCreate, ProductUpdate, ProductRead
from app.crud import crud_product
from app.api.deps import get_current_admin_user # <-- Dùng "người gác cổng" Admin
from app.models.user import User
from app.models.product import Product
from app.core.config import settings

router = APIRouter()

@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    *,
    product_in: ProductCreate,
    current_admin: User = Depends(get_current_admin_user)
):
    product = await crud_product.create_product(product_in=product_in)
    # Return dict with string id for frontend compatibility
    product_dict = product.dict()
    product_dict["id"] = str(product.id)
    return product_dict

@router.get("", response_model=List[ProductRead])
async def read_products(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin_user)
):
    return await crud_product.get_multi_products(skip=skip, limit=limit)

@router.get("/paginated")
async def read_products_paginated(
    *,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Lấy danh sách sản phẩm với phân trang và tìm kiếm.
    """
    products, total = await crud_product.get_all_products_with_count(skip=skip, limit=limit, search=search)
    
    # Convert to dicts and set string id for frontend compatibility
    data = []
    for product in products:
        product_dict = product.dict()
        product_dict["id"] = str(product.id)
        data.append(product_dict)
    
    return {
        "data": data,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{product_id}", response_model=ProductRead)
async def read_product_by_id(
    product_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    product = await crud_product.get_product(product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Return dict with string id for frontend compatibility
    product_dict = product.dict()
    product_dict["id"] = str(product.id)
    return product_dict

@router.put("/{product_id}", response_model=ProductRead)
async def update_existing_product(
    *,
    product_id: PydanticObjectId,
    product_in: ProductUpdate,
    current_admin: User = Depends(get_current_admin_user)
):
    product = await crud_product.get_product(product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    updated_product = await crud_product.update_product(product=product, product_in=product_in)
    # Return dict with string id for frontend compatibility
    product_dict = updated_product.dict()
    product_dict["id"] = str(updated_product.id)
    return product_dict

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_product(
    product_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    product = await crud_product.get_product(product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await crud_product.delete_product(product=product)


@router.get('/low-stock', response_model=List[dict])
async def read_low_stock_products(
    threshold: int = None,
    current_admin: User = Depends(get_current_admin_user)
):
    """Return products with stock <= threshold (admin-only). If threshold is None, use app config default."""
    thr = threshold if threshold is not None else settings.LOW_STOCK_THRESHOLD
    products = await Product.find(Product.stock_quantity <= thr).to_list()
    # Return minimal dicts for frontend
    return [{"id": str(p.id), "name": p.name, "stock_quantity": p.stock_quantity, "price": p.price} for p in products]