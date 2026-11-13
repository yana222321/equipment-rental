from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Service
from ..schemas import ServiceOut

router = APIRouter(prefix="/api/services", tags=["Услуги"])


@router.get("", response_model=list[ServiceOut], summary="Каталог услуг")
def list_services(
    category: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
) -> list[Service]:
    stmt = select(Service)
    if category:
        stmt = stmt.where(Service.category == category)
    if q:
        term = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                Service.name.ilike(term),
                Service.description.ilike(term),
                Service.category.ilike(term),
            )
        )
    stmt = stmt.order_by(Service.category, Service.base_price)
    return list(db.scalars(stmt))


@router.get("/categories", response_model=list[str], summary="Категории услуг")
def list_categories(db: Session = Depends(get_db)) -> list[str]:
    rows = db.scalars(select(Service.category).distinct().order_by(Service.category))
    return list(rows)
