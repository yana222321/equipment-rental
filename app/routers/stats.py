from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db, utcnow
from ..deps import require_roles
from ..models import STATUS_LABELS, RepairOrder, Service, SparePart, User

router = APIRouter(prefix="/api/stats", tags=["Статистика"])

MONTHS_RU = ("янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек")
ACTIVE = ("new", "accepted", "diagnostics", "in_progress", "waiting_parts", "ready")


@router.get("/overview", summary="Сводная статистика")
def overview(
    user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> dict:
    orders = list(db.scalars(select(RepairOrder).options(selectinload(RepairOrder.service))))
    parts = list(db.scalars(select(SparePart).order_by(SparePart.name)))
    masters = list(db.scalars(select(User).where(User.role == "master").order_by(User.full_name)))
    clients_count = db.scalar(select(func.count(User.id)).where(User.role == "client")) or 0

    completed = [o for o in orders if o.status == "completed"]
    active = [o for o in orders if o.status in ACTIVE]
    revenue = round(sum(o.total_cost for o in completed), 2)

    durations = [
        (o.completed_at - o.created_at).total_seconds() / 86400
        for o in completed
        if o.completed_at and o.completed_at >= o.created_at
    ]
    avg_days = round(sum(durations) / len(durations), 1) if durations else 0

    by_status = [
        {"status": key, "label": label, "count": sum(1 for o in orders if o.status == key)}
        for key, label in STATUS_LABELS.items()
    ]

    now = utcnow()
    monthly = []
    for shift in range(5, -1, -1):
        year, month = now.year, now.month - shift
        while month <= 0:
            month += 12
            year -= 1
        month_orders = [o for o in orders if o.created_at.year == year and o.created_at.month == month]
        month_revenue = sum(
            o.total_cost
            for o in completed
            if o.completed_at and o.completed_at.year == year and o.completed_at.month == month
        )
        monthly.append(
            {
                "label": f"{MONTHS_RU[month - 1]} {str(year)[2:]}",
                "orders": len(month_orders),
                "revenue": round(month_revenue, 2),
            }
        )

    service_stats: dict[str, dict] = {}
    for order in orders:
        name = order.service.name if order.service else "Без услуги"
        entry = service_stats.setdefault(name, {"name": name, "count": 0, "revenue": 0.0})
        entry["count"] += 1
        if order.status == "completed":
            entry["revenue"] = round(entry["revenue"] + order.total_cost, 2)
    top_services = sorted(service_stats.values(), key=lambda x: (-x["count"], -x["revenue"]))[:5]

    master_load = []
    for master in masters:
        own = [o for o in orders if o.master_id == master.id]
        master_load.append(
            {
                "id": master.id,
                "name": master.full_name,
                "active": sum(1 for o in own if o.status in ACTIVE),
                "completed": sum(1 for o in own if o.status == "completed"),
                "revenue": round(sum(o.total_cost for o in own if o.status == "completed"), 2),
            }
        )

    low_stock = [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "stock_qty": p.stock_qty,
            "min_threshold": p.min_threshold,
        }
        for p in parts
        if p.stock_qty <= p.min_threshold
    ]

    categories = Counter(o.service.category for o in orders if o.service)

    return {
        "totals": {
            "orders": len(orders),
            "active": len(active),
            "completed": len(completed),
            "revenue": revenue,
            "avg_days": avg_days,
            "clients": clients_count,
            "masters": len(masters),
            "low_stock": len(low_stock),
        },
        "by_status": by_status,
        "monthly": monthly,
        "top_services": top_services,
        "master_load": master_load,
        "low_stock": low_stock,
        "categories": [{"name": k, "count": v} for k, v in categories.most_common()],
    }
