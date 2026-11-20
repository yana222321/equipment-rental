-- Seed data for Repair Workshop (SQLite)
-- Password hashes are BCrypt for: admin123, master123, client123 (generated at runtime by app seeder preferred)
-- This file provides reference seed; backend DbSeeder creates users with valid hashes on first run.

INSERT INTO Services (Id, Name, Category, BasePrice, EstimatedTime, IsActive) VALUES
(1, 'Диагностика устройства', 'Любая техника', 500.00, 'от 30 минут', 1),
(2, 'Замена дисплея', 'Смартфоны и планшеты', 2500.00, 'от 1 часа', 1),
(3, 'Чистка и обслуживание', 'Ноутбуки и компьютеры', 1800.00, 'от 2 часов', 1),
(4, 'Ремонт материнской платы', 'Ноутбуки и компьютеры', 3500.00, 'от 2 дней', 1),
(5, 'Замена аккумулятора', 'Смартфоны и планшеты', 1200.00, 'от 40 минут', 1),
(6, 'Ремонт принтера', 'Оргтехника', 1500.00, 'от 1 дня', 1);

INSERT INTO Parts (Id, Name, Sku, Category, StockQuantity, UnitPrice, MinQuantity) VALUES
(1, 'Дисплей iPhone 13', 'DSP-IP13-01', 'Дисплеи', 8, 5200.00, 2),
(2, 'Аккумулятор Redmi Note 12', 'BAT-RN12-02', 'Аккумуляторы', 3, 1100.00, 2),
(3, 'Термопаста Arctic MX-4', 'THM-MX4-04', 'Расходники', 18, 650.00, 5),
(4, 'SSD Kingston 512 ГБ', 'SSD-K512-03', 'Накопители', 2, 3800.00, 2),
(5, 'Клавиатура ASUS VivoBook', 'KEY-AS15-05', 'Комплектующие', 6, 2400.00, 2);

-- Demo users (replace PasswordHash with real BCrypt hashes if inserting manually)
INSERT INTO Users (Id, FullName, Email, Phone, PasswordHash, Role, CreatedAt) VALUES
(1, 'Александр Кузнецов', 'admin@rapira.local', '+7 900 000-00-01', '$2a$11$REPLACE_WITH_BCRYPT_HASH', 'Admin', datetime('now')),
(2, 'Алексей Морозов', 'master1@rapira.local', '+7 900 000-00-02', '$2a$11$REPLACE_WITH_BCRYPT_HASH', 'Master', datetime('now')),
(3, 'Иван Петров', 'master2@rapira.local', '+7 900 000-00-03', '$2a$11$REPLACE_WITH_BCRYPT_HASH', 'Master', datetime('now')),
(4, 'Елена Белова', 'master3@rapira.local', '+7 900 000-00-04', '$2a$11$REPLACE_WITH_BCRYPT_HASH', 'Master', datetime('now')),
(5, 'Анна Смирнова', 'client@rapira.local', '+7 999 123-45-67', '$2a$11$REPLACE_WITH_BCRYPT_HASH', 'Client', datetime('now'));

INSERT INTO RepairOrders (Id, ClientId, MasterId, DeviceType, DeviceModel, IssueDescription, PhotoPath, Status, TotalCost, CreatedAt, UpdatedAt) VALUES
(1, 5, 2, 'Смартфон', 'iPhone 13', 'Замена дисплея', NULL, 2, 8500.00, datetime('now','-2 days'), datetime('now','-1 day')),
(2, 5, 3, 'Ноутбук', 'MacBook Air M1', 'Не включается', NULL, 1, 1500.00, datetime('now','-2 days'), datetime('now','-2 days')),
(3, 5, NULL, 'Телевизор', 'Samsung UE43', 'Нет изображения', NULL, 0, 0.00, datetime('now','-1 day'), datetime('now','-1 day'));

INSERT INTO OrderComments (Id, OrderId, AuthorId, Text, CreatedAt) VALUES
(1, 1, 2, 'Диагностика завершена. Требуется замена дисплейного модуля.', datetime('now','-1 day'));
