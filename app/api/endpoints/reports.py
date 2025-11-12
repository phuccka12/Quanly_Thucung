from fastapi import APIRouter, Depends, HTTPException
from fastapi import status
from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from app.api.deps import get_current_admin_user
from app.models.user import User
from app.models.health_record import HealthRecord
from app.models.product import Product
from app.models.order import Order

router = APIRouter()


@router.get('/revenue', summary='Revenue report (admin only)')
async def revenue_report(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    group_by: Optional[str] = None,  # 'day'|'week'|'month'|'year'
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

    # Build optional time series grouped by day/week/month/year
    series = None
    if group_by:
        # helpers to produce a string key for the period
        def key_for(dt: datetime):
            if group_by == 'day':
                return dt.strftime('%Y-%m-%d')
            if group_by == 'month':
                return dt.strftime('%Y-%m')
            if group_by == 'year':
                return dt.strftime('%Y')
            if group_by == 'week':
                # ISO week: YYYY-Www
                iso = dt.isocalendar()
                return f"{iso[0]}-W{iso[1]:02d}"
            return dt.strftime('%Y-%m-%d')

        buckets = {}
        # initialize buckets from records
        for r in records:
            if not r.date:
                continue
            k = key_for(r.date)
            if k not in buckets:
                buckets[k] = 0.0

            # revenue inside this record
            rec_rev = 0.0
            if r.used_products:
                for up in r.used_products:
                    rec_rev += up.quantity * up.unit_price
            if r.used_services:
                for s in r.used_services:
                    rec_rev += s.price

            buckets[k] += rec_rev

        # include Orders in time-series and totals
        # Build an orders query similar to records (use created_at)
        order_query = {}
        if start_date:
            order_query['created_at'] = {"$gte": start_date}
        if end_date:
            order_query.setdefault('created_at', {})['$lte'] = end_date
        # exclude cancelled orders
        order_query['status'] = {"$ne": 'cancelled'}

        try:
            orders = await Order.find(order_query).to_list()
        except Exception:
            orders = []

        # Add orders revenue into totals and buckets
        for o in orders:
            # add order total to overall counters
            try:
                o_total = float(getattr(o, 'total', 0.0) or 0.0)
            except Exception:
                o_total = 0.0
            total_revenue += o_total

            # contribute to by_product from order items
            for it in getattr(o, 'items', []) or []:
                pid = str(getattr(it, 'product_id', '') or '')
                qty = int(getattr(it, 'quantity', 0) or 0)
                subtotal = float(getattr(it, 'subtotal', 0.0) or 0.0)
                if pid:
                    by_product.setdefault(pid, {'quantity': 0, 'revenue': 0.0})
                    by_product[pid]['quantity'] += qty
                    by_product[pid]['revenue'] += subtotal

            # add to series buckets using created_at
            dt = getattr(o, 'created_at', None)
            if dt:
                k = key_for(dt)
                if k not in buckets:
                    buckets[k] = 0.0
                buckets[k] += o_total

        # sort keys chronologically where possible
        def sort_key_period(kstr: str):
            try:
                if group_by == 'day':
                    return datetime.strptime(kstr, '%Y-%m-%d')
                if group_by == 'month':
                    return datetime.strptime(kstr, '%Y-%m')
                if group_by == 'year':
                    return datetime.strptime(kstr, '%Y')
                if group_by == 'week':
                    # parse YYYY-Www
                    y, w = kstr.split('-W')
                    y = int(y); w = int(w)
                    # approximate week start as Monday
                    return datetime.fromisocalendar(y, w, 1)
            except Exception:
                return datetime.min
            return datetime.min

        sorted_keys = sorted(buckets.keys(), key=sort_key_period)
        series = [{'period': k, 'revenue': buckets[k]} for k in sorted_keys]

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
        'series': series,
    }
