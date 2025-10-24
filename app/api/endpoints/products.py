from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from app.schemas.product import ProductCreate, ProductUpdate, ProductRead
from app.crud import crud_product
from app.api.deps import get_current_admin_user # <-- Dùng "người gác cổng" Admin
from app.models.user import User
from app.models.product import Product

router = APIRouter()

@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_new_product(
    *,
    product_in: ProductCreate,
    current_admin: User = Depends(get_current_admin_user)
):
    return await crud_product.create_product(product_in=product_in)

@router.get("", response_model=List[ProductRead])
async def read_products(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin_user)
):
    return await crud_product.get_multi_products(skip=skip, limit=limit)

@router.get("/{product_id}", response_model=ProductRead)
async def read_product_by_id(
    product_id: PydanticObjectId,
    current_admin: User = Depends(get_current_admin_user)
):
    product = await crud_product.get_product(product_id=product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

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
    return await crud_product.update_product(product=product, product_in=product_in)

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
    from app.core.config import settings
    thr = threshold if threshold is not None else settings.LOW_STOCK_THRESHOLD
    products = await Product.find(Product.stock_quantity <= thr).to_list()
    # Return minimal dicts for frontend
    return [{"id": str(p.id), "name": p.name, "stock_quantity": p.stock_quantity, "price": p.price} for p in products]