from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from beanie import PydanticObjectId
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.api.deps import get_current_admin_user

router = APIRouter()


@router.get('/', tags=['Admin Orders'])
async def list_orders(skip: int = 0, limit: int = 100, admin: User = Depends(get_current_admin_user)):
    orders = await Order.find_all().skip(skip).limit(limit).to_list()
    out = []
    for o in orders:
        try:
            od = o.dict()
        except Exception:
            od = { 'items': getattr(o, 'items', []), 'status': getattr(o, 'status', None) }
        try:
            od['id'] = str(o.id)
        except Exception:
            od['id'] = None
        out.append(od)
    return out


@router.get('/{order_id}', tags=['Admin Orders'])
async def get_order(order_id: str, admin: User = Depends(get_current_admin_user)):
    order = None
    # Try to load by ObjectId first, fall back to direct get by string
    try:
        oid = PydanticObjectId(order_id)
        order = await Order.get(oid)
    except Exception:
        # fallback: maybe order_id is already a string id usable by Beanie
        try:
            order = await Order.get(order_id)
        except Exception:
            order = None
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    od = order.dict()
    try:
        od['id'] = str(order.id)
    except Exception:
        od['id'] = None
    return od


@router.put('/{order_id}', tags=['Admin Orders'])
async def update_order_status(order_id: str, payload: dict, admin: User = Depends(get_current_admin_user)):
    order = None
    try:
        oid = PydanticObjectId(order_id)
        order = await Order.get(oid)
    except Exception:
        try:
            order = await Order.get(order_id)
        except Exception:
            order = None
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    status_val = payload.get('status')
    if not status_val:
        raise HTTPException(status_code=400, detail='Missing status')
    # Normalize status string
    try:
        order.status = str(status_val).lower()
    except Exception:
        order.status = status_val
    await order.save()
    return { 'ok': True }


@router.post('/{order_id}/cancel', tags=['Admin Orders'])
async def admin_cancel_order(order_id: str, admin: User = Depends(get_current_admin_user)):
    order = None
    try:
        oid = PydanticObjectId(order_id)
        order = await Order.get(oid)
    except Exception:
        try:
            order = await Order.get(order_id)
        except Exception:
            order = None
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')
    # If already cancelled, return
    if getattr(order, 'status', '').lower() == 'cancelled':
        return { 'ok': True, 'detail': 'Already cancelled' }
    # Restock items (best-effort)
    restocked = 0
    missing_products = []
    try:
        for it in getattr(order, 'items', []) or []:
            pid = None
            if isinstance(it, dict):
                pid = it.get('product_id')
                qty = it.get('quantity', 0)
            else:
                pid = getattr(it, 'product_id', None)
                qty = getattr(it, 'quantity', 0)

            if not pid:
                continue

            prod = None
            # Try ObjectId lookup first
            try:
                pid_obj = PydanticObjectId(pid)
                prod = await Product.get(pid_obj)
            except Exception:
                prod = None

            # Fallback: try to find a product whose id string matches (best-effort)
            if not prod:
                try:
                    prod = await Product.find_one({'_id': pid})
                except Exception:
                    prod = None

            if prod:
                try:
                    current = (getattr(prod, 'stock_quantity', 0) or 0)
                    add = int(qty or 0)
                    prod.stock_quantity = current + add
                    await prod.save()
                    restocked += add
                except Exception:
                    # log and continue on save failure
                    print(f"Failed to restock product {pid}")
                    continue
            else:
                missing_products.append(pid)
    except Exception as e:
        print('Error during restock loop:', e)

    order.status = 'cancelled'
    await order.save()
    return { 'ok': True, 'restocked': restocked, 'missing_products': missing_products }
