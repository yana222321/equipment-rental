from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Авторизация"])


def _token_response(user: User) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(user.id, user.role),
        user=UserOut.model_validate(user),
    )


@router.post(
    "/register",
    response_model=TokenOut,
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация клиента",
)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    email = payload.email.lower().strip()
    exists = db.scalar(select(User).where(func.lower(User.email) == email))
    if exists:
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует")

    user = User(
        full_name=payload.full_name,
        email=email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role="client",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenOut, summary="Вход в систему")
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    email = payload.email.lower().strip()
    user = db.scalar(select(User).where(func.lower(User.email) == email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    return _token_response(user)


@router.get("/me", response_model=UserOut, summary="Текущий пользователь")
def me(user: User = Depends(get_current_user)) -> User:
    return user
