from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_roles
from ..models import RepairOrder, Service, StatusHistory, User
from ..schemas import OrderCreate, OrderOut
from ..serializers import order_out
from ..queries import order_query

router = APIRouter(prefix="/api/client", tags=["Личный кабинет клиента"])


@router.post(
    "/requests",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Создать заявку на ремонт",
)
def create_request(
    payload: OrderCreate,
    user: User = Depends(require_roles("client", "admin")),
    db: Session = Depends(get_db),
) -> dict:
    service = db.get(Service, payload.service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Услуга не найдена")

    order = RepairOrder(
        client_id=user.id,
        service_id=service.id,
        device_type=payload.device_type.strip(),
        device_model=payload.device_model.strip(),
        issue_desc=payload.issue_desc.strip(),
        photo_url=payload.photo_url,
        status="new",
        labor_cost=round(service.base_price, 2),
        total_cost=round(service.base_price, 2),
    )
    db.add(order)
    db.flush()
    db.add(
        StatusHistory(
            order_id=order.id,
            changed_by=user.id,
            old_status=None,
            new_status="new",
            comment="Заявка создана клиентом",
        )
    )
    db.commit()
    order = db.scalar(order_query().where(RepairOrder.id == order.id))
    return order_out(order)


@router.get("/requests", response_model=list[OrderOut], summary="Мои заявки")
def my_requests(
    user: User = Depends(require_roles("client", "admin")),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = order_query().where(RepairOrder.client_id == user.id).order_by(RepairOrder.created_at.desc())
    return [order_out(o) for o in db.scalars(stmt)]


@router.get("/requests/{order_id}", response_model=OrderOut, summary="Заявка с деталями")
def my_request(
    order_id: int,
    user: User = Depends(require_roles("client", "admin")),
    db: Session = Depends(get_db),
) -> dict:
    order = db.scalar(order_query().where(RepairOrder.id == order_id))
    if order is None or (order.client_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return order_out(order)


@router.patch("/requests/{order_id}/cancel", response_model=OrderOut, summary="Отменить заявку")
def cancel_request(
    order_id: int,
    user: User = Depends(require_roles("client", "admin")),
    db: Session = Depends(get_db),
) -> dict:
    order = db.get(RepairOrder, order_id)
    if order is None or (order.client_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if order.status not in ("new", "accepted"):
        raise HTTPException(status_code=409, detail="Заявку уже нельзя отменить — ремонт начался")
    old_status = order.status
    order.status = "canceled"
    db.add(
        StatusHistory(
            order_id=order.id,
            changed_by=user.id,
            old_status=old_status,
            new_status="canceled",
            comment="Заявка отменена клиентом",
        )
    )
    db.commit()
    order = db.scalar(order_query().where(RepairOrder.id == order.id))
    return order_out(order)
