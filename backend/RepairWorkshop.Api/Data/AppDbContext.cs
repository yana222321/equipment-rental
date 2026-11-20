using Microsoft.EntityFrameworkCore;
using RepairWorkshop.Api.Models;

namespace RepairWorkshop.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Part> Parts => Set<Part>();
    public DbSet<RepairOrder> RepairOrders => Set<RepairOrder>();
    public DbSet<OrderComment> OrderComments => Set<OrderComment>();
    public DbSet<OrderPart> OrderParts => Set<OrderPart>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<Part>().HasIndex(p => p.Sku).IsUnique();

        modelBuilder.Entity<RepairOrder>()
            .HasOne(o => o.Client)
            .WithMany(u => u.ClientOrders)
            .HasForeignKey(o => o.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RepairOrder>()
            .HasOne(o => o.Master)
            .WithMany(u => u.MasterOrders)
            .HasForeignKey(o => o.MasterId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrderComment>()
            .HasOne(c => c.Order)
            .WithMany(o => o.Comments)
            .HasForeignKey(c => c.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderComment>()
            .HasOne(c => c.Author)
            .WithMany()
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderPart>()
            .HasOne(op => op.Order)
            .WithMany(o => o.UsedParts)
            .HasForeignKey(op => op.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderPart>()
            .HasOne(op => op.Part)
            .WithMany(p => p.OrderParts)
            .HasForeignKey(op => op.PartId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RepairOrder>().Property(o => o.TotalCost).HasPrecision(12, 2);
        modelBuilder.Entity<Service>().Property(s => s.BasePrice).HasPrecision(12, 2);
        modelBuilder.Entity<Part>().Property(p => p.UnitPrice).HasPrecision(12, 2);
        modelBuilder.Entity<OrderPart>().Property(op => op.UnitPrice).HasPrecision(12, 2);

        modelBuilder.Entity<Service>().HasData(
            new Service { Id = 1, Name = "Диагностика устройства", Category = "Любая техника", BasePrice = 500, EstimatedTime = "от 30 минут", IsActive = true },
            new Service { Id = 2, Name = "Замена дисплея", Category = "Смартфоны и планшеты", BasePrice = 2500, EstimatedTime = "от 1 часа", IsActive = true },
            new Service { Id = 3, Name = "Чистка и обслуживание", Category = "Ноутбуки и компьютеры", BasePrice = 1800, EstimatedTime = "от 2 часов", IsActive = true },
            new Service { Id = 4, Name = "Ремонт материнской платы", Category = "Ноутбуки и компьютеры", BasePrice = 3500, EstimatedTime = "от 2 дней", IsActive = true },
            new Service { Id = 5, Name = "Замена аккумулятора", Category = "Смартфоны и планшеты", BasePrice = 1200, EstimatedTime = "от 40 минут", IsActive = true },
            new Service { Id = 6, Name = "Ремонт принтера", Category = "Оргтехника", BasePrice = 1500, EstimatedTime = "от 1 дня", IsActive = true }
        );

        modelBuilder.Entity<Part>().HasData(
            new Part { Id = 1, Name = "Дисплей iPhone 13", Sku = "DSP-IP13-01", Category = "Дисплеи", StockQuantity = 8, UnitPrice = 5200, MinQuantity = 2 },
            new Part { Id = 2, Name = "Аккумулятор Redmi Note 12", Sku = "BAT-RN12-02", Category = "Аккумуляторы", StockQuantity = 3, UnitPrice = 1100, MinQuantity = 2 },
            new Part { Id = 3, Name = "Термопаста Arctic MX-4", Sku = "THM-MX4-04", Category = "Расходники", StockQuantity = 18, UnitPrice = 650, MinQuantity = 5 },
            new Part { Id = 4, Name = "SSD Kingston 512 ГБ", Sku = "SSD-K512-03", Category = "Накопители", StockQuantity = 2, UnitPrice = 3800, MinQuantity = 2 },
            new Part { Id = 5, Name = "Клавиатура ASUS VivoBook", Sku = "KEY-AS15-05", Category = "Комплектующие", StockQuantity = 6, UnitPrice = 2400, MinQuantity = 2 }
        );
    }
}
