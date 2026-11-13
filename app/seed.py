"""Демо-данные для разработки: python -m app.seed (или автоматически при первом запуске)."""

import secrets
from datetime import timedelta

from sqlalchemy import func, select

from .database import SessionLocal, utcnow
from .models import OrderPart, Receipt, RepairOrder, Service, SparePart, StatusHistory, User
from .security import hash_password

STATUS_COMMENTS = {
    "new": "Заявка создана клиентом",
    "accepted": "Заявка принята, согласовываем диагностику",
    "diagnostics": "Проведена диагностика, причина найдена",
    "in_progress": "Ремонт начат",
    "waiting_parts": "Ожидаем поступление запчасти на склад",
    "ready": "Устройство готово к выдаче",
    "completed": "Работы завершены, устройство выдано клиенту",
    "canceled": "Заявка отменена",
}


def seed_if_empty() -> bool:
    db = SessionLocal()
    try:
        if db.scalar(select(func.count(User.id))):
            return False

        admin = User(
            full_name="Ирина Соколова",
            email="admin@workshop.ru",
            phone="+7 (495) 120-45-67",
            password_hash=hash_password("admin123"),
            role="admin",
        )
        master1 = User(
            full_name="Дмитрий Орлов",
            email="master@workshop.ru",
            phone="+7 (916) 300-11-22",
            password_hash=hash_password("master123"),
            role="master",
        )
        master2 = User(
            full_name="Алексей Петров",
            email="master2@workshop.ru",
            phone="+7 (916) 300-33-44",
            password_hash=hash_password("master123"),
            role="master",
        )
        client1 = User(
            full_name="Анна Смирнова",
            email="client@workshop.ru",
            phone="+7 (903) 555-77-88",
            password_hash=hash_password("client123"),
            role="client",
        )
        client2 = User(
            full_name="Павел Кузнецов",
            email="client2@workshop.ru",
            phone="+7 (903) 555-99-00",
            password_hash=hash_password("client123"),
            role="client",
        )
        clients = [client1, client2]
        masters = [master1, master2]
        db.add_all([admin, master1, master2, client1, client2])
        db.flush()

        services_data = [
            ("Смартфоны", "Замена экрана", "Оригинальный или совместимый дисплей, калибровка сенсора.", 3500, 1),
            ("Смартфоны", "Замена аккумулятора", "Новая батарея повышенной ёмкости, проверка циклов заряда.", 1900, 1),
            ("Смартфоны", "Ремонт после попадания влаги", "Ультразвуковая чистка платы, восстановление контактов.", 2900, 2),
            ("Смартфоны", "Замена разъёма зарядки", "Пайка нового разъёма USB-C или Lightning.", 2200, 1),
            ("Ноутбуки", "Чистка от пыли и замена термопасты", "Профилактика системы охлаждения, замена термоинтерфейса.", 2500, 1),
            ("Ноутбуки", "Замена клавиатуры", "Подбор совместимой клавиатуры и замена модуля.", 3200, 2),
            ("Ноутбуки", "Ремонт материнской платы", "Диагностика цепей питания, замена компонентов, реболлинг.", 6500, 3),
            ("Ноутбуки", "Замена матрицы", "Установка нового дисплея с проверкой подсветки и шлейфа.", 5500, 2),
            ("Бытовая техника", "Диагностика", "Выездная или стационарная диагностика, заключение мастера.", 500, 1),
            ("Бытовая техника", "Ремонт стиральной машины", "Замена помпы, подшипников, устранение протечек.", 4200, 3),
            ("Бытовая техника", "Ремонт микроволновой печи", "Замена магнетрона, трансформатора, предохранителей.", 2600, 2),
            ("Аудиотехника", "Замена динамика", "Подбор и установка динамика, проверка звукового тракта.", 1800, 1),
            ("Аудиотехника", "Ремонт наушников", "Замена кабеля, разъёма, восстановление баланса каналов.", 900, 1),
            ("Планшеты", "Замена стекла", "Замена тачскрина с сохранением родного дисплея.", 4800, 2),
        ]
        services = [Service(category=c, name=n, description=d, base_price=p, est_days=e) for c, n, d, p, e in services_data]
        db.add_all(services)
        db.flush()

        parts_data = [
            ("SCR-IP13", "Дисплей iPhone 13", 8, 8900, 3),
            ("BAT-IP13", "Аккумулятор iPhone 13", 14, 2900, 4),
            ("SCR-SAM-A52", "Дисплей Samsung Galaxy A52", 5, 5400, 2),
            ("BAT-XIA-RN10", "Аккумулятор Redmi Note 10", 3, 1900, 3),
            ("SSD-480", "SSD 480 ГБ SATA", 12, 4200, 3),
            ("RAM-DDR4-8", "Память DDR4 8 ГБ", 7, 2600, 3),
            ("KB-HP-PAV", "Клавиатура HP Pavilion", 4, 3100, 2),
            ("THERM-1", "Термопаста Arctic MX-4", 25, 450, 6),
            ("PUMP-WASH", "Помпа стиральной машины", 2, 2400, 2),
            ("SPEAK-JBL", "Динамик JBL Flip 5", 5, 1500, 2),
            ("FAN-LAP", "Вентилятор ноутбука", 9, 1200, 2),
            ("CONN-USBC", "Разъём USB-C", 18, 600, 5),
        ]
        parts = [SparePart(sku=s, name=n, stock_qty=q, unit_price=p, min_threshold=m) for s, n, q, p, m in parts_data]
        db.add_all(parts)
        db.flush()

        order_specs = [
            # days_ago, status, service_idx, client_idx, master_idx, device, model, issue, parts
            (148, "completed", 0, 0, 0, "Смартфон", "iPhone 13", "Треснул экран после падения, не работает часть сенсора.", [(0, 1)]),
            (126, "completed", 4, 1, 1, "Ноутбук", "MacBook Air M1", "Шумит вентилятор, корпус греется при работе.", [(7, 1)]),
            (101, "completed", 9, 0, 0, "Стиральная машина", "Bosch Serie 6", "Не сливает воду, слышен гул при отжиме.", [(8, 1)]),
            (74, "completed", 1, 1, 1, "Смартфон", "Redmi Note 10", "Быстро разряжается, батарея вздулась.", [(3, 1)]),
            (58, "completed", 5, 0, 0, "Ноутбук", "HP Pavilion 15", "Залипают клавиши, не работает пробел.", [(6, 1)]),
            (41, "completed", 11, 1, 1, "Колонка", "JBL Flip 5", "Хрипит динамик на высокой громкости.", [(9, 1)]),
            (27, "completed", 7, 0, 0, "Ноутбук", "Lenovo IdeaPad 5", "Разбита матрица, есть полосы на экране.", []),
            (19, "completed", 2, 1, 1, "Смартфон", "Samsung Galaxy A52", "Попал под дождь, не включается.", []),
            (13, "ready", 3, 0, 0, "Смартфон", "iPhone 12", "Не заряжается от кабеля, разъём расшатан.", [(11, 1)]),
            (8, "in_progress", 6, 1, 1, "Ноутбук", "Asus ZenBook 14", "Не включается, индикатор заряда мигает.", []),
            (5, "waiting_parts", 9, 0, 0, "Стиральная машина", "LG F-2H5", "Протекает вода из-под барабана.", [(8, 1)]),
            (3, "diagnostics", 8, 1, 1, "Микроволновая печь", "Samsung ME83", "Греет, но не крутится тарелка.", []),
            (2, "accepted", 12, 0, None, "Наушники", "Sony WH-1000XM4", "Пропадает звук в правом наушнике.", []),
            (1, "new", 10, 1, None, "Микроволновая печь", "LG MS-2042", "Искрит внутри при включении.", []),
            (0, "new", 0, 0, None, "Смартфон", "iPhone 11", "Разбит экран, нужна замена дисплея.", []),
            (16, "canceled", 11, 1, 0, "Колонка", "Sony SRS-XB12", "Тихий звук, клиент отказался от ремонта.", []),
        ]

        now = utcnow()
        for days_ago, status, service_idx, client_idx, master_idx, device_type, model, issue, used_parts in order_specs:
            service = services[service_idx]
            created = now - timedelta(days=days_ago, hours=3)
            order = RepairOrder(
                client_id=clients[client_idx].id,
                master_id=masters[master_idx].id if master_idx is not None else None,
                service_id=service.id,
                device_type=device_type,
                device_model=model,
                issue_desc=issue,
                status=status,
                labor_cost=service.base_price,
                created_at=created,
            )
            db.add(order)
            db.flush()

            parts_total = 0.0
            for part_idx, qty in used_parts:
                part = parts[part_idx]
                db.add(
                    OrderPart(
                        order_id=order.id,
                        part_id=part.id,
                        quantity=qty,
                        fixed_price=part.unit_price,
                    )
                )
                parts_total += part.unit_price * qty
            order.total_cost = round(service.base_price + parts_total, 2)

            if status == "completed":
                order.completed_at = created + timedelta(days=min(service.est_days + 1, 5), hours=4)

            paths = {
                "completed": ["new", "accepted", "diagnostics", "in_progress", "ready", "completed"],
                "ready": ["new", "accepted", "in_progress", "ready"],
                "in_progress": ["new", "accepted", "in_progress"],
                "waiting_parts": ["new", "accepted", "diagnostics", "waiting_parts"],
                "diagnostics": ["new", "accepted", "diagnostics"],
                "accepted": ["new", "accepted"],
                "new": ["new"],
                "canceled": ["new", "canceled"],
            }[status]
            end = order.completed_at or (now - timedelta(hours=5))
            step = (end - created) / max(len(paths) - 1, 1)

            for i, state in enumerate(paths):
                author_id = clients[client_idx].id if state in ("new", "canceled") else (
                    masters[master_idx].id if master_idx is not None else admin.id
                )
                db.add(
                    StatusHistory(
                        order_id=order.id,
                        changed_by=author_id,
                        old_status=paths[i - 1] if i else None,
                        new_status=state,
                        comment=STATUS_COMMENTS[state],
                        changed_at=created + step * i,
                    )
                )

            if status == "completed":
                token = secrets.token_urlsafe(18)
                db.add(
                    Receipt(
                        order_id=order.id,
                        doc_type="act",
                        qr_token=token,
                        pdf_path=f"/r/{token}",
                        issued_at=order.completed_at,
                    )
                )

        db.commit()
        return True
    finally:
        db.close()


if __name__ == "__main__":
    from .database import Base, engine

    Base.metadata.create_all(bind=engine)
    created = seed_if_empty()
    print("Демо-данные созданы" if created else "База уже содержит данные — пропуск")
