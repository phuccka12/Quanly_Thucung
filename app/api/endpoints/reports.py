from fastapi import APIRouter, Depends, HTTPException
from fastapi import status
from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.models.health_record import HealthRecord
from app.models.product import Product

router = APIRouter()


@router.get('/revenue', summary='Revenue report (admin only)')
async def revenue_report(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_admin: User = Depends(get_current_admin_user)
):
    """Return revenue summary from used_products and used_services between dates."""
    query = {}
    if start_date:
        query['date'] = {"$gte": start_date}
    if end_date:
        query.setdefault('date', {})['$lte'] = end_date

    # Load matching health records
    records = await HealthRecord.find(query).to_list()

    total_revenue = 0.0
    by_product = {}
    by_service = {}

    for r in records:
        if r.used_products:
            for up in r.used_products:
                amount = up.quantity * up.unit_price
                total_revenue += amount
                by_product.setdefault(str(up.product_id), {'quantity': 0, 'revenue': 0.0})
                by_product[str(up.product_id)]['quantity'] += up.quantity
                by_product[str(up.product_id)]['revenue'] += amount
        if r.used_services:
            for s in r.used_services:
                total_revenue += s.price
                by_service.setdefault(s.name, {'count': 0, 'revenue': 0.0})
                by_service[s.name]['count'] += 1
                by_service[s.name]['revenue'] += s.price

    # Optionally resolve product names
    product_ids = list(by_product.keys())
    products = {}
    if product_ids:
        for pid in product_ids:
            try:
                prod = await Product.get(PydanticObjectId(pid))
                products[pid] = prod.name if prod else pid
            except Exception:
                products[pid] = pid

    return {
        'total_revenue': total_revenue,
        'by_product': {products.get(k, k): v for k, v in by_product.items()},
        'by_service': by_service,
        'records_count': len(records),
    }
