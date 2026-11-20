# Ремонтная мастерская (frontend)

Клиентская часть проекта: React 19 + TypeScript + Vite 8 + Tailwind CSS v4.

## Структура

- `src/main.tsx` — точка входа, монтирует `App` и подключает стили
- `src/App.tsx` — основной компонент интерфейса
- `src/index.css` — глобальные стили и импорт Tailwind (`@import 'tailwindcss';`)
- `index.html` — HTML-шаблон
- `vite.config.ts` — конфигурация Vite (React, Tailwind, alias `@` → `src`)
- `backend/RepairWorkshop.Api/` — backend (ASP.NET Core Web API)
- `database/` — схема и описание БД

## Команды

- `pnpm install` — установка зависимостей
- `pnpm dev` — запуск dev-сервера
- `pnpm build` — сборка
- `pnpm preview` — предпросмотр сборки
- `pnpm format` — форматирование (oxfmt)

Подробности по запуску всего проекта — в корневом `README.md`.
