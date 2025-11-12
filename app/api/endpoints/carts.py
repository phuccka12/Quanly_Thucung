from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.cart import Cart, CartItem
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()


class CartItemIn(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)


class CartIn(BaseModel):
    items: List[CartItemIn] = []


@router.get('/me', response_model=Cart)
async def get_my_cart(current_user: User = Depends(get_current_user)):
    c = await Cart.find_one(Cart.user_id == str(current_user.id))
    if not c:
        return Cart(user_id=str(current_user.id), items=[])
    return c


@router.put('/me')
async def put_my_cart(payload: CartIn, current_user: User = Depends(get_current_user)):
    # replace current user's cart
    c = await Cart.find_one(Cart.user_id == str(current_user.id))
    items = []
    for it in payload.items:
        items.append(CartItem(product_id=it.product_id, quantity=it.quantity))
    if not c:
        c = Cart(user_id=str(current_user.id), items=items)
        await c.insert()
    else:
        c.items = items
        c.updated_at = __import__('datetime').datetime.utcnow()
        await c.save()
    return { 'ok': True }


@router.delete('/me')
async def clear_my_cart(current_user: User = Depends(get_current_user)):
    c = await Cart.find_one(Cart.user_id == str(current_user.id))
    if c:
        await c.delete()
    return { 'ok': True }

