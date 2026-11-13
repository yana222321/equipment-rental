import secrets
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db, utcnow
from ..deps import require_roles
from ..models import STATUS_LABELS, STATUS_TRANSITIONS, OrderPart, Receipt, RepairOrder, SparePart, StatusHistory, User
from ..queries import order_query
from ..schemas import OrderOut, PartAdd, PartOut, ReceiptIn, ReceiptOut, StatusUpdate
from ..serializers import order_out, part_out, receipt_out, recalc_total

router = APIRouter(prefix="/api/master", tags=["Рабочее место мастера"])

ACTIVE_STATUSES = ("new", "accepted", "diagnostics", "in_progress", "waiting_parts", "ready")


def _get_master_order(db: Session, order_id: int, user: User, auto_take: bool = True) -> RepairOrder:
    order = db.get(RepairOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if order.master_id is None and auto_take:
        order.master_id = user.id
    elif order.master_id != user.id:
        raise HTTPException(status_code=403, detail="Заявка закреплена за другим мастером")
    return order


def _reload(db: Session, order_id: int) -> dict:
    order = db.scalar(order_query().where(RepairOrder.id == order_id))
    return order_out(order)


@router.get("/requests", response_model=list[OrderOut], summary="Заявки мастера")
def list_requests(
    scope: str = Query(default="mine", pattern="^(mine|available|all)$"),
    status_filter: str | None = Query(default=None, alias="status"),
    user: User = Depends(require_roles("master", "admin")),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = order_query()
    if scope == "mine":
        stmt = stmt.where(RepairOrder.master_id == user.id)
    elif scope == "available":
        stmt = stmt.where(
            RepairOrder.master_id.is_(None), RepairOrder.status.in_(ACTIVE_STATUSES)
        )
    else:
        stmt = stmt.where(
            (RepairOrder.master_id == user.id) | RepairOrder.master_id.is_(None)
        )
    if status_filter:
        if status_filter not in STATUS_LABELS:
            raise HTTPException(status_code=422, detail="Неизвестный статус")
        stmt = stmt.where(RepairOrder.status == status_filter)
    stmt = stmt.order_by(RepairOrder.created_at.desc())
    return [order_out(o) for o in db.scalars(stmt)]


@router.post("/requests/{order_id}/take", response_model=OrderOut, summary="Взять заявку в работу")
def take_request(
    order_id: int,
    user: User = Depends(require_roles("master", "admin")),
    db: Session = Depends(get_db),
) -> dict:
    order = db.get(RepairOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if order.master_id not in (None, user.id):
        raise HTTPException(status_code=409, detail="Заявка уже закреплена за другим мастером")
    order.master_id = user.id
    db.commit()
    return _reload(db, order_id)


@router.patch(
    "/requests/{order_id}/status",
    response_model=OrderOut,
    summary="Сменить статус заявки",
)
def change_status(
    order_id: int,
    payload: StatusUpdate,
    user: User = Depends(require_roles("master", "admin")),
    db: Session = Depends(get_db),
) -> dict:
    order = _get_master_order(db, order_id, user)
    if order.status in ("completed", "canceled"):
        raise HTTPException(status_code=409, detail="Завершённую или отменённую заявку нельзя изменить")

    old_status = order.status
    changed = payload.status != old_status
    if changed and payload.status not in STATUS_TRANSITIONS.get(old_status, ()):
        raise HTTPException(
            status_code=409,
            detail=f"Недопустимый переход: «{STATUS_LABELS[old_status]}» → «{STATUS_LABELS[payload.status]}»",
        )

    if payload.labor_cost is not None:
        order.labor_cost = round(payload.labor_cost, 2)

    if changed:
        order.status = payload.status
        if payload.status == "completed":
            order.completed_at = utcnow()
        db.add(
            StatusHistory(
                order_id=order.id,
                changed_by=user.id,
                old_status=old_status,
                new_status=payload.status,
                comment=payload.comment,
            )
        )
    elif payload.comment:
        db.add(
            StatusHistory(
                order_id=order.id,
                changed_by=user.id,
                old_status=old_status,
                new_status=old_status,
                comment=payload.comment,
            )
        )

    recalc_total(order)
    db.commit()
    return _reload(db, order_id)


@router.post(
    "/requests/{order_id}/parts",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Списать запчасть на заявку",
)
def add_part(
    order_id: int,
    payload: PartAdd,
    user: User = Depends(require_roles("master", "admin")),
    db: Session = Depends(get_db),
) -> dict:
    order = _get_master_order(db, order_id, user)
    if order.status in ("completed", "canceled"):
        raise HTTPException(status_code=409, detail="Заявка закрыта")

    part = db.get(SparePart, payload.part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Запчасть не найдена")
    if part.stock_qty < payload.quantity:
        raise HTTPException(
            status_code=409,
            detail=f"На складе недостаточно: доступно {part.stock_qty} шт.",
        )

    existing = db.scalar(
        select(OrderPart).where(OrderPart.order_id == order.id, OrderPart.part_id == part.id)
    )
    price = payload.fixed_price if payload.fixed_price is not None else part.unit_price
    if existing:
        existing.quantity += payload.quantity
        existing.fixed_price = round(price, 2)
    else:
        db.add(
            OrderPart(
                order_id=order.id,
                part_id=part.id,
                quantity=payload.quantity,
                fixed_price=round(price, 2),
            )
        )
    part.stock_qty -= payload.quantity
    db.flush()
    order = db.get(RepairOrder, order.id)
    recalc_total(order)
    db.commit()
    return _reload(db, order_id)


@router.delete(
    "/requests/{order_id}/parts/{order_part_id}",
    response_model=OrderOut,
    summary="Вернуть запчасть на склад",
)
def remove_part(
    order_id: int,
    order_part_id: int,
    user: User = Depends(require_roles("master", "admin")),
    db: Session = Depends(get_db),
) -> dict:
    order = _get_master_order(db, order_id, user)
    if order.status in ("completed", "canceled"):
        raise HTTPException(status_code=409, detail="Заявка закрыта")
    item = db.get(OrderPart, order_part_id)
    if item is None or item.order_id != order.id:
        raise HTTPException(status_code=404, detail="Запчасть в заявке не найдена")
    part = db.get(SparePart, item.part_id)
    if part:
        part.stock_qty += item.quantity
    db.delete(item)
    db.flush()
    order = db.get(RepairOrder, order.id)
    recalc_total(order)
    db.commit()
    return _reload(db, order_id)


@router.post(
    "/requests/{order_id}/receipts",
    response_model=ReceiptOut,
    status_code=status.HTTP_201_CREATED,
    summary="Сформировать квитанцию/акт",
)
def issue_receipt(
    order_id: int,
    payload: ReceiptIn,
    user: User = Depends(require_roles("master", "admin")),
    db: Session = Depends(get_db),
) -> dict:
    order = _get_master_order(db, order_id, user)
    if not order.parts and order.labor_cost <= 0:
        raise HTTPException(status_code=409, detail="Сначала укажите стоимость работ или запчасти")
    token = secrets.token_urlsafe(18)
    receipt = Receipt(
        order_id=order.id,
        doc_type=payload.doc_type,
        qr_token=token,
        pdf_path=f"/r/{token}",
    )
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt_out(receipt)


@router.get("/parts", response_model=list[PartOut], summary="Запчасти для списания")
def list_parts(
    q: str | None = Query(default=None, max_length=100),
    user: User = Depends(require_roles("master", "admin")),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = select(SparePart).order_by(SparePart.name)
    if q:
        term = f"%{q.strip().lower()}%"
        stmt = stmt.where(SparePart.name.ilike(term) | SparePart.sku.ilike(term))
    return [part_out(p) for p in db.scalars(stmt)]
