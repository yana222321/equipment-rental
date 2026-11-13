from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..config import UPLOAD_DIR, settings
from ..deps import get_current_user
from ..models import User

router = APIRouter(prefix="/api/uploads", tags=["Загрузка файлов"])

ALLOWED = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@router.post("", summary="Загрузить фото устройства")
async def upload_photo(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
) -> dict:
    ext = ALLOWED.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=415, detail="Поддерживаются только JPG, PNG и WebP")
    data = await file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Файл больше 5 МБ")
    if not data:
        raise HTTPException(status_code=400, detail="Пустой файл")

    name = f"{uuid4().hex}{ext}"
    path: Path = UPLOAD_DIR / name
    path.write_bytes(data)
    return {"url": f"/static/uploads/{name}"}
