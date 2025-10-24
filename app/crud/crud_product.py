from typing import List, Optional
from beanie import PydanticObjectId
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

async def create_product(product_in: ProductCreate) -> Product:
    product = Product(**product_in.dict())
    await product.insert()
    return product

async def get_product(product_id: PydanticObjectId) -> Optional[Product]:
    return await Product.get(product_id)

async def get_multi_products(skip: int = 0, limit: int = 100) -> List[Product]:
    return await Product.find_all().skip(skip).limit(limit).to_list()

async def update_product(product: Product, product_in: ProductUpdate) -> Product:
    update_data = product_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    await product.save()
    return product

async def delete_product(product: Product) -> None:
    await product.delete()