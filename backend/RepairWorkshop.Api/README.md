# Backend — Ремонтная мастерская (ASP.NET Core Web API)

REST API для фронтенда мастерской: авторизация (JWT), роли, заявки на ремонт, услуги, склад запчастей, статистика.

## Стек
- **.NET 10 / ASP.NET Core Web API** (controllers)
- **EF Core + SQLite** (`Data Source=repair_workshop.db`)
- **JWT Bearer** аутентификация, **BCrypt** хеширование паролей
- OpenAPI (dev): `/openapi/v1.json`

## Запуск
```bash
cd backend/RepairWorkshop.Api
dotnet restore
dotnet run
```
По умолчанию профиль Development слушает `http://localhost:5062` (см. `Properties/launchSettings.json`).  
При первом запуске БД создаётся автоматически (`EnsureCreated`) и заполняется демо-данными (`Data/DbSeeder.cs`).

## Демо-учётные записи
| Роль | Email | Пароль |
|---|---|---|
| Администратор | `admin@rapira.local` | `admin123` |
| Мастер | `master1@rapira.local` | `master123` |
| Мастер | `master2@rapira.local` | `master123` |
| Мастер | `master3@rapira.local` | `master123` |
| Клиент | `client@rapira.local` | `client123` |

## Конфигурация (`appsettings.json`)
- `ConnectionStrings:DefaultConnection` — строка подключения SQLite
- `Jwt:Key/Issuer/Audience/ExpireDays` — параметры JWT (в продакшене заменить ключ и хранить в секретах)
- `Cors:Origins` — разрешённые origin’ы фронтенда (`localhost:5173`, `localhost:8443`)

## Роли и доступ
- **Client**: регистрация/вход, просмотр каталога услуг, создание своих заявок (с фото), просмотр/история своих заявок.
- **Master**: просмотр назначенных заявок, смена статуса, комментарии, указание использованных запчастей/стоимости, просмотр/корректировка склада.
- **Admin**: полный доступ — управление заявками (назначение мастеров), услугами, запчастями, пользователями/ролями, статистика.

## Основные эндпоинты

### Auth (`/api/auth`)
- `POST /register` — регистрация клиента `{ fullName, email, phone?, password }`
- `POST /login` — вход `{ email, password }` → `{ token, user }`
- `GET /me` — текущий пользователь (Bearer)

### Услуги (`/api/services`)
- `GET /` — список активных услуг (`?includeInactive=true` для всех)
- `POST /`, `PUT /{id}`, `DELETE /{id}` — Admin

### Запчасти (`/api/parts`)
- `GET /` — список (`?search=`)
- `POST /`, `PUT /{id}`, `POST /{id}/adjust` `{ delta }` — Admin/Master
- `DELETE /{id}` — Admin

### Пользователи (`/api/users`)
- `GET /` (`?role=`), `PATCH /{id}/role` — Admin
- `GET /masters` — авторизованные пользователи (для назначения)

### Заявки (`/api/orders`)
- `GET /` — список с учётом роли (`?status=&search=&masterId=`)
- `GET /{id}` — детали
- `POST /` — создание (`multipart/form-data`: `clientId?`, `masterId?`, `deviceType`, `deviceModel`, `issueDescription`, `photo?`)
- `PATCH /{id}/status` `{ status }` — Admin/Master (назначенный)
- `PATCH /{id}/assign` `{ masterId }` — Admin
- `POST /{id}/comments` `{ text }` — Admin/Master
- `PATCH /{id}/cost` `{ totalCost }` — Admin/Master
- `POST /{id}/parts` `{ partId, quantity }` — списание запчасти и увеличение стоимости — Admin/Master
- `GET /statuses` — справочник статусов

Статусы (строкой в API, int в БД): `Принята`, `В диагностике`, `В ремонте`, `Готова к выдаче`, `Выдана`.

### Статистика (`/api/stats`, Admin)
- `GET /summary?period=week|month|today`
- `GET /by-status?period=`
- `GET /by-device-type?period=`
- `GET /masters-workload`
- `GET /daily?days=7`

## Загрузка фото
Файлы сохраняются в `Uploads/` и раздаются по `/uploads/<file>` (jpg/png/webp, до 5 МБ). Путь сохраняется в `RepairOrders.PhotoPath`.

## База данных
SQL-схема, ER-диаграмма и описание: [`../../database/README.md`](../../database/README.md), [`../../database/schema.sql`](../../database/schema.sql).
