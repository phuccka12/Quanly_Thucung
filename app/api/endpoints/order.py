from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import List
from beanie import PydanticObjectId

from app.models.product import Product
from app.models.order import Order, OrderItem, ShippingInfo
from fastapi import status
from pydantic import BaseModel
from beanie import PydanticObjectId

router = APIRouter()


class CreateOrderItem(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)


class CreateOrderPayload(BaseModel):
    items: List[CreateOrderItem]
    shipping: ShippingInfo


@router.post("/portal/orders", tags=["Portal Orders"])
async def create_order(payload: CreateOrderPayload, request: Request):
    # Expect authenticated user populated in request.state.user
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not payload.items:
        raise HTTPException(status_code=400, detail="No items to order")

    items_snapshot = []
    total = 0.0

    # Validate products and adjust stock
    for it in payload.items:
        try:
            pid = PydanticObjectId(it.product_id)
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid product id: {it.product_id}")

        product = await Product.get(pid)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {it.product_id}")

        if product.stock_quantity < it.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product.name}")

        unit_price = float(product.price)
        subtotal = unit_price * it.quantity
        total += subtotal

        items_snapshot.append(OrderItem(product_id=str(product.id), name=product.name, unit_price=unit_price, quantity=it.quantity, subtotal=subtotal))

        # decrement stock for this product and save
        try:
            product.stock_quantity = max(0, product.stock_quantity - it.quantity)
            await product.save()
        except Exception as e:
            # If saving stock fails, log and abort
            print(f"[create_order] failed to save product stock for {product.id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update product stock")

    order = Order(
        user_email=getattr(user, 'email', '') or '',
        user_name=getattr(user, 'full_name', None) or None,
        items=items_snapshot,
        shipping=payload.shipping,
        total=total,
    )

    # insert order
    await order.insert()
    # Log payload for debugging
    try:
        print(f"[create_order] payload_items={len(payload.items)} payload={payload.dict()}")
    except Exception:
        pass
    # Logging for debugging: print created order id and user
    try:
        print(f"[create_order] user={getattr(user,'email',None)} order_id={order.id} total={total} items={len(order.items)}")
    except Exception:
        pass

    # Return the created order object (as dict) so frontend can show it immediately
    try:
        order_dict = order.dict()
        order_dict["id"] = str(order.id)
    except Exception:
        order_dict = {"id": str(order.id), "total": total}
    return {"detail": "Order created", "order_id": str(order.id), "total": total, "order": order_dict}


@router.get("/portal/orders", tags=["Portal Orders"])
async def list_my_orders(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    email = getattr(user, 'email', None)
    if not email:
        raise HTTPException(status_code=400, detail="User has no email")

    orders = await Order.find(Order.user_email == email).to_list()
    # Debug log
    try:
        print(f"[list_my_orders] user={email} count={len(orders)}")
        for o in orders:
            print(f"[list_my_orders] order_id={o.id} user_email={o.user_email} items={len(o.items)} total={o.total}")
    except Exception:
        pass
    # Return normalized shape (convert documents to dicts), include string id for each order
    data = []
    try:
        for o in orders:
            od = o.dict()
            try:
                od["id"] = str(o.id)
            except Exception:
                od["id"] = None
            data.append(od)
    except Exception:
        # fallback: return whatever we have
        data = orders
    return {"data": data}



class CancelOrderResponse(BaseModel):
    detail: str


@router.delete('/portal/orders/{order_id}', response_model=CancelOrderResponse)
async def cancel_order(order_id: str, request: Request):
    """Allow portal users to cancel an order according to Lai rules:

    - If order.status == 'pending' -> allow cancellation (restock items and set status 'cancelled').
    - If order.status in ('shipped','confirmed') -> disallow and instruct to contact support.
    """
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(status_code=401, detail='Unauthorized')

    try:
        oid = PydanticObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid order id')

    order = await Order.get(oid)
    if not order:
        raise HTTPException(status_code=404, detail='Order not found')

    # Verify ownership - compare emails (case-insensitive)
    owner_email = getattr(order, 'user_email', None) or ''
    if owner_email.lower() != getattr(user, 'email', '').lower():
        raise HTTPException(status_code=403, detail='Forbidden')

    status_val = getattr(order, 'status', '').lower()
    if status_val == 'pending':
        # perform restock for each item (best-effort)
        try:
            for it in getattr(order, 'items', []) or []:
                try:
                    pid = PydanticObjectId(it.get('product_id') if isinstance(it, dict) else it.product_id)
                    prod = await Product.get(pid)
                    if prod:
                        prod.stock_quantity = (getattr(prod, 'stock_quantity', 0) or 0) + (it.get('quantity') if isinstance(it, dict) else it.quantity)
                        await prod.save()
                except Exception:
                    # ignore per-item failures
                    continue
        except Exception:
            pass

        order.status = 'cancelled'
        await order.save()
        return { 'detail': 'Order cancelled' }
    else:
        # Disallow cancellation for orders already processed/shipped
        raise HTTPException(status_code=400, detail='Không thể hủy đơn này. Vui lòng liên hệ CSKH.')
