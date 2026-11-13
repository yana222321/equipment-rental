from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_roles
from ..models import STATUS_LABELS, RepairOrder, Service, SparePart, StatusHistory, User
from ..queries import order_query
from ..schemas import (
    AssignIn,
    EmployeeIn,
    EmployeeUpdate,
    OrderOut,
    PartIn,
    PartOut,
    PartUpdate,
    ServiceIn,
    ServiceOut,
    ServiceUpdate,
    UserOut,
)
from ..security import hash_password
from ..serializers import order_out, part_out

router = APIRouter(prefix="/api/admin", tags=["Панель администратора"])
admin_only = require_roles("admin")


# ---------- Услуги ----------


@router.get("/services", response_model=list[ServiceOut], summary="Все услуги")
def admin_services(
    q: str | None = Query(default=None, max_length=100),
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> list[Service]:
    stmt = select(Service).order_by(Service.category, Service.name)
    if q:
        term = f"%{q.strip().lower()}%"
        stmt = stmt.where(Service.name.ilike(term) | Service.category.ilike(term))
    return list(db.scalars(stmt))


@router.post("/services", response_model=ServiceOut, status_code=201, summary="Добавить услугу")
def create_service(
    payload: ServiceIn,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> Service:
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.patch("/services/{service_id}", response_model=ServiceOut, summary="Изменить услугу")
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> Service:
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/services/{service_id}", status_code=204, summary="Удалить услугу")
def delete_service(
    service_id: int,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> None:
    service = db.get(Service, service_id)
    if service is None:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    used = db.scalar(select(func.count(RepairOrder.id)).where(RepairOrder.service_id == service_id))
    if used:
        raise HTTPException(status_code=409, detail="Услуга используется в заявках — удаление запрещено")
    db.delete(service)
    db.commit()


# ---------- Запчасти и склад ----------


@router.get("/spare-parts", response_model=list[PartOut], summary="Склад запчастей")
def spare_parts(
    q: str | None = Query(default=None, max_length=100),
    low_only: bool = Query(default=False),
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = select(SparePart).order_by(SparePart.name)
    if q:
        term = f"%{q.strip().lower()}%"
        stmt = stmt.where(SparePart.name.ilike(term) | SparePart.sku.ilike(term))
    if low_only:
        stmt = stmt.where(SparePart.stock_qty <= SparePart.min_threshold)
    return [part_out(p) for p in db.scalars(stmt)]


@router.post("/spare-parts", response_model=PartOut, status_code=201, summary="Добавить запчасть")
def create_part(
    payload: PartIn,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> dict:
    sku = payload.sku.strip().upper()
    if db.scalar(select(SparePart).where(SparePart.sku == sku)):
        raise HTTPException(status_code=409, detail="Запчасть с таким артикулом уже существует")
    part = SparePart(**{**payload.model_dump(), "sku": sku})
    db.add(part)
    db.commit()
    db.refresh(part)
    return part_out(part)


@router.patch("/spare-parts/{part_id}", response_model=PartOut, summary="Изменить запчасть")
def update_part(
    part_id: int,
    payload: PartUpdate,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> dict:
    part = db.get(SparePart, part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Запчасть не найдена")
    data = payload.model_dump(exclude_unset=True)
    if "sku" in data and data["sku"]:
        data["sku"] = data["sku"].strip().upper()
        duplicate = db.scalar(
            select(SparePart).where(SparePart.sku == data["sku"], SparePart.id != part_id)
        )
        if duplicate:
            raise HTTPException(status_code=409, detail="Запчасть с таким артикулом уже существует")
    for field, value in data.items():
        setattr(part, field, value)
    db.commit()
    db.refresh(part)
    return part_out(part)


@router.delete("/spare-parts/{part_id}", status_code=204, summary="Удалить запчасть")
def delete_part(
    part_id: int,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> None:
    part = db.get(SparePart, part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Запчасть не найдена")
    if part.order_parts:
        raise HTTPException(status_code=409, detail="Запчасть используется в заявках — удаление запрещено")
    db.delete(part)
    db.commit()


# ---------- Сотрудники ----------


@router.get("/employees", response_model=list[UserOut], summary="Сотрудники")
def employees(
    role: str | None = Query(default=None, pattern="^(master|admin|client)$"),
    q: str | None = Query(default=None, max_length=100),
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> list[User]:
    stmt = select(User).where(User.role.in_(("master", "admin")))
    if role:
        stmt = stmt.where(User.role == role)
    if q:
        term = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(User.full_name.ilike(term), User.email.ilike(term)))
    return list(db.scalars(stmt.order_by(User.role, User.full_name)))


@router.post("/employees", response_model=UserOut, status_code=201, summary="Добавить сотрудника")
def create_employee(
    payload: EmployeeIn,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> User:
    email = payload.email.lower().strip()
    if db.scalar(select(User).where(func.lower(User.email) == email)):
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует")
    employee = User(
        full_name=payload.full_name.strip(),
        email=email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.patch("/employees/{employee_id}", response_model=UserOut, summary="Изменить сотрудника")
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> User:
    employee = db.get(User, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    if employee.id == user.id and payload.role and payload.role != "admin":
        raise HTTPException(status_code=409, detail="Нельзя снять роль администратора с себя")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        if field == "full_name" and value:
            value = value.strip()
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/employees/{employee_id}", status_code=204, summary="Удалить сотрудника")
def delete_employee(
    employee_id: int,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> None:
    employee = db.get(User, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    if employee.id == user.id:
        raise HTTPException(status_code=409, detail="Нельзя удалить свою учётную запись")
    orders = db.scalars(select(RepairOrder).where(RepairOrder.master_id == employee.id))
    for order in orders:
        order.master_id = None
    history = db.scalars(select(StatusHistory).where(StatusHistory.changed_by == employee.id))
    for item in history:
        item.changed_by = None
    db.delete(employee)
    db.commit()


# ---------- Заявки ----------


@router.get("/orders", response_model=list[OrderOut], summary="Все заявки")
def admin_orders(
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, max_length=100),
    master_id: int | None = Query(default=None),
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> list[dict]:
    stmt = order_query()
    if status_filter:
        if status_filter not in STATUS_LABELS:
            raise HTTPException(status_code=422, detail="Неизвестный статус")
        stmt = stmt.where(RepairOrder.status == status_filter)
    if master_id is not None:
        stmt = stmt.where(RepairOrder.master_id == master_id)
    if q:
        term = f"%{q.strip().lower()}%"
        stmt = stmt.where(
            or_(
                RepairOrder.device_model.ilike(term),
                RepairOrder.device_type.ilike(term),
                RepairOrder.issue_desc.ilike(term),
                RepairOrder.client.has(User.full_name.ilike(term)),
            )
        )
    stmt = stmt.order_by(RepairOrder.created_at.desc())
    return [order_out(o) for o in db.scalars(stmt)]


@router.patch("/orders/{order_id}/assign", response_model=OrderOut, summary="Назначить мастера")
def assign_master(
    order_id: int,
    payload: AssignIn,
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> dict:
    order = db.get(RepairOrder, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if order.status in ("completed", "canceled"):
        raise HTTPException(status_code=409, detail="Заявка закрыта")

    if payload.master_id is None:
        order.master_id = None
        db.add(
            StatusHistory(
                order_id=order.id,
                changed_by=user.id,
                old_status=order.status,
                new_status=order.status,
                comment="Мастер снят с заявки",
            )
        )
    else:
        master = db.get(User, payload.master_id)
        if master is None or master.role != "master":
            raise HTTPException(status_code=422, detail="Выберите мастера")
        order.master_id = master.id
        db.add(
            StatusHistory(
                order_id=order.id,
                changed_by=user.id,
                old_status=order.status,
                new_status=order.status,
                comment=f"Назначен мастер: {master.full_name}",
            )
        )
    db.commit()
    order = db.scalar(order_query().where(RepairOrder.id == order_id))
    return order_out(order)


@router.get("/masters", response_model=list[UserOut], summary="Мастера для назначения")
def list_masters(
    user: User = Depends(admin_only),
    db: Session = Depends(get_db),
) -> list[User]:
    return list(db.scalars(select(User).where(User.role == "master").order_by(User.full_name)))
