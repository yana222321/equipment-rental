from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base, utcnow

ROLES = ("client", "master", "admin")

STATUS_LABELS: dict[str, str] = {
    "new": "Новая",
    "accepted": "Принята",
    "diagnostics": "Диагностика",
    "in_progress": "В работе",
    "waiting_parts": "Ожидает запчасти",
    "ready": "Готова к выдаче",
    "completed": "Завершена",
    "canceled": "Отменена",
}

STATUS_TRANSITIONS: dict[str, tuple[str, ...]] = {
    "new": ("accepted", "diagnostics", "canceled"),
    "accepted": ("diagnostics", "in_progress", "canceled"),
    "diagnostics": ("in_progress", "waiting_parts", "ready", "canceled"),
    "in_progress": ("waiting_parts", "ready", "canceled"),
    "waiting_parts": ("in_progress", "ready", "canceled"),
    "ready": ("completed", "in_progress"),
    "completed": (),
    "canceled": (),
}


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False, default="client", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    client_orders: Mapped[list[RepairOrder]] = relationship(
        back_populates="client", foreign_keys="RepairOrder.client_id"
    )
    master_orders: Mapped[list[RepairOrder]] = relationship(
        back_populates="master", foreign_keys="RepairOrder.master_id"
    )


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    base_price: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    est_days: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    orders: Mapped[list[RepairOrder]] = relationship(back_populates="service")


class SparePart(Base):
    __tablename__ = "spare_parts"

    id: Mapped[int] = mapped_column(primary_key=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    stock_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    min_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    order_parts: Mapped[list[OrderPart]] = relationship(back_populates="part")


class RepairOrder(Base):
    __tablename__ = "repair_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    master_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    device_type: Mapped[str] = mapped_column(String(80), nullable=False)
    device_model: Mapped[str] = mapped_column(String(160), nullable=False)
    issue_desc: Mapped[str] = mapped_column(Text, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="new", index=True)
    labor_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    client: Mapped[User] = relationship(back_populates="client_orders", foreign_keys=[client_id])
    master: Mapped[User | None] = relationship(back_populates="master_orders", foreign_keys=[master_id])
    service: Mapped[Service] = relationship(back_populates="orders")
    parts: Mapped[list[OrderPart]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    history: Mapped[list[StatusHistory]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="StatusHistory.changed_at"
    )
    receipts: Mapped[list[Receipt]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )

    @property
    def parts_cost(self) -> float:
        return round(sum(p.quantity * p.fixed_price for p in self.parts), 2)


class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("repair_orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    changed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    old_status: Mapped[str | None] = mapped_column(String(24), nullable=True)
    new_status: Mapped[str] = mapped_column(String(24), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    order: Mapped[RepairOrder] = relationship(back_populates="history")
    author: Mapped[User | None] = relationship(foreign_keys=[changed_by])


class OrderPart(Base):
    __tablename__ = "order_parts"
    __table_args__ = (UniqueConstraint("order_id", "part_id", name="uq_order_part"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("repair_orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    part_id: Mapped[int] = mapped_column(ForeignKey("spare_parts.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    fixed_price: Mapped[float] = mapped_column(Float, nullable=False, default=0)

    order: Mapped[RepairOrder] = relationship(back_populates="parts")
    part: Mapped[SparePart] = relationship(back_populates="order_parts")


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("repair_orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    doc_type: Mapped[str] = mapped_column(String(24), nullable=False, default="invoice")
    qr_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    pdf_path: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    issued_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    order: Mapped[RepairOrder] = relationship(back_populates="receipts")
