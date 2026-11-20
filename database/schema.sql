-- Repair Workshop database schema (SQLite)
-- Compatible with backend/RepairWorkshop.Api (EF Core, SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    FullName TEXT NOT NULL,
    Email TEXT NOT NULL UNIQUE,
    Phone TEXT NULL,
    PasswordHash TEXT NOT NULL,
    Role TEXT NOT NULL CHECK (Role IN ('Client', 'Master', 'Admin')),
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Services (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Category TEXT NOT NULL,
    BasePrice NUMERIC(12,2) NOT NULL DEFAULT 0,
    EstimatedTime TEXT NOT NULL DEFAULT '',
    IsActive INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Parts (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Sku TEXT NOT NULL UNIQUE,
    Category TEXT NOT NULL DEFAULT '',
    StockQuantity INTEGER NOT NULL DEFAULT 0 CHECK (StockQuantity >= 0),
    UnitPrice NUMERIC(12,2) NOT NULL DEFAULT 0,
    MinQuantity INTEGER NOT NULL DEFAULT 2
);

-- Status: 0=Accepted(Принята), 1=Diagnosing(В диагностике), 2=InRepair(В ремонте),
--         3=ReadyForPickup(Готова к выдаче), 4=Issued(Выдана)
CREATE TABLE IF NOT EXISTS RepairOrders (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ClientId INTEGER NOT NULL,
    MasterId INTEGER NULL,
    DeviceType TEXT NOT NULL DEFAULT '',
    DeviceModel TEXT NOT NULL,
    IssueDescription TEXT NOT NULL,
    PhotoPath TEXT NULL,
    Status INTEGER NOT NULL DEFAULT 0,
    TotalCost NUMERIC(12,2) NOT NULL DEFAULT 0,
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT FK_RepairOrders_Client FOREIGN KEY (ClientId) REFERENCES Users(Id) ON DELETE RESTRICT,
    CONSTRAINT FK_RepairOrders_Master FOREIGN KEY (MasterId) REFERENCES Users(Id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS OrderComments (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderId INTEGER NOT NULL,
    AuthorId INTEGER NOT NULL,
    Text TEXT NOT NULL,
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    CONSTRAINT FK_OrderComments_Order FOREIGN KEY (OrderId) REFERENCES RepairOrders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderComments_Author FOREIGN KEY (AuthorId) REFERENCES Users(Id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS OrderParts (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderId INTEGER NOT NULL,
    PartId INTEGER NOT NULL,
    Quantity INTEGER NOT NULL CHECK (Quantity > 0),
    UnitPrice NUMERIC(12,2) NOT NULL,
    CONSTRAINT FK_OrderParts_Order FOREIGN KEY (OrderId) REFERENCES RepairOrders(Id) ON DELETE CASCADE,
    CONSTRAINT FK_OrderParts_Part FOREIGN KEY (PartId) REFERENCES Parts(Id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS IX_Users_Email ON Users(Email);
CREATE INDEX IF NOT EXISTS IX_Parts_Sku ON Parts(Sku);
CREATE INDEX IF NOT EXISTS IX_RepairOrders_ClientId ON RepairOrders(ClientId);
CREATE INDEX IF NOT EXISTS IX_RepairOrders_MasterId ON RepairOrders(MasterId);
CREATE INDEX IF NOT EXISTS IX_RepairOrders_Status ON RepairOrders(Status);
CREATE INDEX IF NOT EXISTS IX_RepairOrders_CreatedAt ON RepairOrders(CreatedAt);
CREATE INDEX IF NOT EXISTS IX_OrderComments_OrderId ON OrderComments(OrderId);
CREATE INDEX IF NOT EXISTS IX_OrderParts_OrderId ON OrderParts(OrderId);
CREATE INDEX IF NOT EXISTS IX_OrderParts_PartId ON OrderParts(PartId);
