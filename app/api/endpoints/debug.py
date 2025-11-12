from fastapi import APIRouter, Request, HTTPException
from typing import List

from app.models.order import Order

router = APIRouter()


@router.get("/orders", tags=["Debug"])
async def debug_list_orders(request: Request):
    """Return all orders in the database for local debugging only.

    This endpoint is intentionally permissive but restricted to local requests
    (127.0.0.1 / ::1). Remove it before deploying to production.
    """
    client_host = None
    try:
        client_host = request.client.host
    except Exception:
        client_host = None

    if client_host not in ("127.0.0.1", "::1", "localhost"):
        raise HTTPException(status_code=403, detail="Forbidden")

    orders = await Order.find_all().to_list()
    try:
        data = [o.dict() for o in orders]
    except Exception:
        data = orders
    return {"count": len(data), "data": data}
