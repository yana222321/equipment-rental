# Ремонтная мастерская «Рапира»

Учебный проект: приложение для сервисного центра по ремонту техники. Позволяет принимать заявки на ремонт, отслеживать их статусы, вести учёт запчастей, управлять услугами и сотрудниками, а также смотреть базовую статистику.

Стек: React 19, Vite 8, TypeScript, Tailwind CSS v4 (frontend) и ASP.NET Core Web API на .NET 10 + EF Core + SQLite (backend).

Интерфейс в `src/App.tsx` сейчас работает на встроенных демо-данных. Бэкенд в `backend/RepairWorkshop.Api/` реализует REST API, авторизацию (JWT), роли и работу с базой данных — его можно запустить отдельно.

## Запуск frontend

```bash
npm install
npm run dev
```

Приложение откроется на `http://localhost:8443` (порт можно переопределить переменной окружения `PORT`).

Сборка и предпросмотр:

```bash
npm run build
npm run preview
```

## Запуск backend

```bash
cd backend/RepairWorkshop.Api
dotnet restore
dotnet run
```

По умолчанию API поднимается на `http://localhost:5277` (см. `Properties/launchSettings.json`).  
OpenAPI (в Development): `http://localhost:5277/openapi/v1.json`.

При первом запуске автоматически создаётся файл БД `repair_workshop.db` в папке backend (`EnsureCreated`) и заполняются демо-данные (услуги, запчасти, пользователи, примеры заявок).  
Загруженные фото заявок сохраняются в `backend/RepairWorkshop.Api/Uploads/` и раздаются по пути `/uploads/<имя_файла>`.

### Демо-аккаунты

| Роль | Email | Пароль |
|---|---|---|
| Администратор | `admin@rapira.local` | `admin123` |
| Мастер | `master1@rapira.local` | `master123` |
| Мастер | `master2@rapira.local` | `master123` |
| Мастер | `master3@rapira.local` | `master123` |
| Клиент | `client@rapira.local` | `client123` |

## Как проверить основные сценарии

1. **Frontend (демо-интерфейс):** откройте `http://localhost:8443` — доступны разделы «Обзор», «Заявки», «Склад запчастей», «Услуги и цены», «Сотрудники», «Статистика». Можно создавать/просматривать заявки, менять статусы и работать со складом в рамках текущей сессии (данные хранятся в состоянии приложения).
2. **Авторизация в API:** `POST /api/auth/login` с телом `{ "email": "admin@rapira.local", "password": "admin123" }` вернёт JWT-токен и данные пользователя. Токен передаётся в заголовке `Authorization: Bearer <token>`.
3. **Заявки:** клиент создаёт заявку `POST /api/orders` (`multipart/form-data`: тип/модель устройства, описание, фото), отслеживает статус и историю; мастер/админ меняют статус (`PATCH /api/orders/{id}/status`), добавляют комментарии и списывают запчасти (`POST /api/orders/{id}/parts`), админ назначает мастера (`PATCH /api/orders/{id}/assign`).
4. **Справочники и учёт:** услуги — `/api/services`, запчасти и приход — `/api/parts` и `/api/parts/{id}/adjust`, пользователи/роли — `/api/users`.
5. **Статистика (админ):** `/api/stats/summary`, `/api/stats/by-status`, `/api/stats/by-device-type`, `/api/stats/masters-workload`, `/api/stats/daily`.

Статусы заявки: **Принята → В диагностике → В ремонте → Готова к выдаче → Выдана**.

## База данных

- Описание и ER-диаграмма: [`database/README.md`](database/README.md)
- Схема (DDL): [`database/schema.sql`](database/schema.sql)
- Демо-данные: [`database/seed.sql`](database/seed.sql)

Основные сущности: `Users` (Client/Master/Admin), `Services`, `Parts`, `RepairOrders`, `OrderComments`, `OrderParts`.

## Структура проекта

```text
src/
  App.tsx        — основной интерфейс приложения
  main.tsx       — точка входа
  index.css      — стили и подключение Tailwind
backend/
  RepairWorkshop.Api/
    Controllers/ — API (auth, orders, services, parts, users, stats)
    Models/      — сущности и статусы
    Data/        — DbContext и сидирование БД
    Dtos/        — DTO запросов/ответов
    Services/    — JWT и вспомогательные сервисы
    Uploads/     — загруженные фото заявок
database/
  schema.sql     — схема БД
  seed.sql       — демо-данные
  README.md      — ER-диаграмма и описание
```

Подробнее про API: [`backend/RepairWorkshop.Api/README.md`](backend/RepairWorkshop.Api/README.md).
