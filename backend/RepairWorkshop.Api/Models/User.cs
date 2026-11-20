using System.ComponentModel.DataAnnotations;

namespace RepairWorkshop.Api.Models;

public class User
{
    public int Id { get; set; }
    [MaxLength(120)] public string FullName { get; set; } = string.Empty;
    [MaxLength(200)] public string Email { get; set; } = string.Empty;
    [MaxLength(30)] public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    [MaxLength(20)] public string Role { get; set; } = Roles.Client;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RepairOrder> ClientOrders { get; set; } = new List<RepairOrder>();
    public ICollection<RepairOrder> MasterOrders { get; set; } = new List<RepairOrder>();
}
