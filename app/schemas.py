import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .models import STATUS_LABELS

PHONE_RE = re.compile(r"^\+?[0-9\s\-()]{10,20}$")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Пользователи и авторизация ----------


class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=20)
    password: str = Field(min_length=6, max_length=72)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if len(value) < 2:
            raise ValueError("Укажите имя и фамилию")
        return value

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, value: str) -> str:
        value = value.strip()
        if not PHONE_RE.match(value):
            raise ValueError("Некорректный номер телефона")
        return value

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        if value.strip() != value:
            raise ValueError("Пароль не должен начинаться или заканчиваться пробелом")
        return value


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UserOut(ORMModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str
    role: str
    created_at: datetime


class UserBrief(BaseModel):
    id: int
    full_name: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class EmployeeIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=20)
    password: str = Field(min_length=6, max_length=72)
    role: Literal["master", "admin"] = "master"

    @field_validator("phone")
    @classmethod
    def clean_phone(cls, value: str) -> str:
        value = value.strip()
        if not PHONE_RE.match(value):
            raise ValueError("Некорректный номер телефона")
        return value


class EmployeeUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=10, max_length=20)
    role: Literal["client", "master", "admin"] | None = None


# ---------- Услуги ----------


class ServiceIn(BaseModel):
    category: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=160)
    description: str = Field(default="", max_length=2000)
    base_price: float = Field(ge=0, le=10_000_000)
    est_days: int = Field(ge=1, le=365)


class ServiceUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=2, max_length=80)
    name: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    base_price: float | None = Field(default=None, ge=0, le=10_000_000)
    est_days: int | None = Field(default=None, ge=1, le=365)


class ServiceOut(ORMModel):
    id: int
    category: str
    name: str
    description: str
    base_price: float
    est_days: int


# ---------- Запчасти ----------


class PartIn(BaseModel):
    sku: str = Field(min_length=2, max_length=64)
    name: str = Field(min_length=2, max_length=160)
    stock_qty: int = Field(ge=0, le=1_000_000)
    unit_price: float = Field(ge=0, le=10_000_000)
    min_threshold: int = Field(default=1, ge=0, le=100_000)


class PartUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=2, max_length=64)
    name: str | None = Field(default=None, min_length=2, max_length=160)
    stock_qty: int | None = Field(default=None, ge=0, le=1_000_000)
    unit_price: float | None = Field(default=None, ge=0, le=10_000_000)
    min_threshold: int | None = Field(default=None, ge=0, le=100_000)


class PartOut(ORMModel):
    id: int
    sku: str
    name: str
    stock_qty: int
    unit_price: float
    min_threshold: int
    low_stock: bool


# ---------- Заявки ----------


class OrderCreate(BaseModel):
    service_id: int
    device_type: str = Field(min_length=2, max_length=80)
    device_model: str = Field(min_length=1, max_length=160)
    issue_desc: str = Field(min_length=10, max_length=2000)
    photo_url: str | None = Field(default=None, max_length=500)

    @field_validator("photo_url")
    @classmethod
    def safe_photo(cls, value: str | None) -> str | None:
        if not value:
            return None
        value = value.strip()
        if not (value.startswith("/static/uploads/") or value.startswith("http://") or value.startswith("https://")):
            raise ValueError("Некорректная ссылка на фото")
        return value


class StatusUpdate(BaseModel):
    status: str
    comment: str | None = Field(default=None, max_length=1000)
    labor_cost: float | None = Field(default=None, ge=0, le=10_000_000)

    @field_validator("status")
    @classmethod
    def known_status(cls, value: str) -> str:
        if value not in STATUS_LABELS:
            raise ValueError("Неизвестный статус")
        return value


class PartAdd(BaseModel):
    part_id: int
    quantity: int = Field(ge=1, le=100)
    fixed_price: float | None = Field(default=None, ge=0, le=10_000_000)


class ReceiptIn(BaseModel):
    doc_type: Literal["invoice", "act"] = "invoice"


class ReceiptOut(ORMModel):
    id: int
    order_id: int
    doc_type: str
    qr_token: str
    pdf_path: str
    issued_at: datetime


class OrderPartOut(BaseModel):
    id: int
    part_id: int
    part_name: str
    part_sku: str
    quantity: int
    fixed_price: float
    total: float


class HistoryOut(BaseModel):
    id: int
    old_status: str | None
    new_status: str
    new_status_label: str
    comment: str | None
    changed_by_name: str | None
    changed_at: datetime


class OrderOut(BaseModel):
    id: int
    client_id: int
    client_name: str
    client_phone: str
    master_id: int | None
    master_name: str | None
    service_id: int
    service_name: str
    service_category: str
    device_type: str
    device_model: str
    issue_desc: str
    photo_url: str | None
    status: str
    status_label: str
    labor_cost: float
    parts_cost: float
    total_cost: float
    created_at: datetime
    completed_at: datetime | None
    parts: list[OrderPartOut] = []
    history: list[HistoryOut] = []
    receipts: list[ReceiptOut] = []


class AssignIn(BaseModel):
    master_id: int | None = None
