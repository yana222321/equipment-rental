using Microsoft.EntityFrameworkCore;
using RepairWorkshop.Api.Models;

namespace RepairWorkshop.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync()) return;

        var admin = new User
        {
            FullName = "Александр Кузнецов",
            Email = "admin@rapira.local",
            Phone = "+7 900 000-00-01",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = Roles.Admin
        };
        var master1 = new User
        {
            FullName = "Алексей Морозов",
            Email = "master1@rapira.local",
            Phone = "+7 900 000-00-02",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("master123"),
            Role = Roles.Master
        };
        var master2 = new User
        {
            FullName = "Иван Петров",
            Email = "master2@rapira.local",
            Phone = "+7 900 000-00-03",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("master123"),
            Role = Roles.Master
        };
        var master3 = new User
        {
            FullName = "Елена Белова",
            Email = "master3@rapira.local",
            Phone = "+7 900 000-00-04",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("master123"),
            Role = Roles.Master
        };
        var client = new User
        {
            FullName = "Анна Смирнова",
            Email = "client@rapira.local",
            Phone = "+7 999 123-45-67",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("client123"),
            Role = Roles.Client
        };
        db.Users.AddRange(admin, master1, master2, master3, client);
        await db.SaveChangesAsync();

        db.RepairOrders.AddRange(
            new RepairOrder { ClientId = client.Id, MasterId = master1.Id, DeviceType = "Смартфон", DeviceModel = "iPhone 13", IssueDescription = "Замена дисплея", Status = OrderStatus.InRepair, TotalCost = 8500, CreatedAt = DateTime.UtcNow.AddDays(-2), UpdatedAt = DateTime.UtcNow.AddDays(-1) },
            new RepairOrder { ClientId = client.Id, MasterId = master2.Id, DeviceType = "Ноутбук", DeviceModel = "MacBook Air M1", IssueDescription = "Не включается", Status = OrderStatus.Diagnosing, TotalCost = 1500, CreatedAt = DateTime.UtcNow.AddDays(-2), UpdatedAt = DateTime.UtcNow.AddDays(-2) },
            new RepairOrder { ClientId = client.Id, MasterId = null, DeviceType = "Телевизор", DeviceModel = "Samsung UE43", IssueDescription = "Нет изображения", Status = OrderStatus.Accepted, TotalCost = 0, CreatedAt = DateTime.UtcNow.AddDays(-1), UpdatedAt = DateTime.UtcNow.AddDays(-1) }
        );
        await db.SaveChangesAsync();

        var order = await db.RepairOrders.FirstAsync();
        db.OrderComments.Add(new OrderComment { OrderId = order.Id, AuthorId = master1.Id, Text = "Диагностика завершена. Требуется замена дисплейного модуля.", CreatedAt = DateTime.UtcNow.AddDays(-1) });
        await db.SaveChangesAsync();
    }
}
