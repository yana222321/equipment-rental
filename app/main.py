from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from .config import BASE_DIR, FRONTEND_DIR, settings
from .database import Base, SessionLocal, engine
from .receipts import receipt_html
from .routers import admin, auth, client, master, services, stats, uploads


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    from .seed import seed_if_empty

    seed_if_empty()
    yield


app = FastAPI(
    title="Ремонтная мастерская — API",
    description=(
        "API сервиса по ремонту техники: заявки, каталог услуг, рабочее место мастера, "
        "склад запчастей, квитанции с QR-кодом и статистика."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth.router, services.router, client.router, master.router, admin.router, stats.router, uploads.router):
    app.include_router(router)


def custom_openapi() -> dict:
    """Схема в формате OpenAPI 3.0 (требование к интеграции)."""
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema["openapi"] = "3.0.3"
    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi  # type: ignore[method-assign]

app.mount("/static", StaticFiles(directory=FRONTEND_DIR / "static"), name="static")

# Свёрстанный лендинг из макета (открывается по адресу /landing/)
app.mount(
    "/landing",
    StaticFiles(directory=BASE_DIR / "landing", html=True),
    name="landing",
)


@app.get("/api/health", tags=["Служебные"], summary="Проверка доступности")
def health() -> dict:
    return {"status": "ok", "app": settings.app_name}


@app.get("/r/{token}", response_class=HTMLResponse, include_in_schema=False)
def public_receipt(token: str, request: Request):
    db = SessionLocal()
    try:
        page = receipt_html(db, token, str(request.base_url))
    finally:
        db.close()
    if page is None:
        raise HTTPException(status_code=404, detail="Документ не найден")
    return HTMLResponse(page)


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    if full_path.startswith(("api/", "static/", "docs", "openapi", "r/")):
        raise HTTPException(status_code=404, detail="Не найдено")
    candidate = FRONTEND_DIR / full_path
    if candidate.is_file() and Path(candidate).resolve().is_relative_to(FRONTEND_DIR.resolve()):
        return FileResponse(candidate)
    return FileResponse(FRONTEND_DIR / "index.html")
