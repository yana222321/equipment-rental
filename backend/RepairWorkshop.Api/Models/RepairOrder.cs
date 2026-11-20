using System.ComponentModel.DataAnnotations;

namespace RepairWorkshop.Api.Models;

public class RepairOrder
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public User Client { get; set; } = null!;
    public int? MasterId { get; set; }
    public User? Master { get; set; }

    [MaxLength(120)] public string DeviceType { get; set; } = string.Empty;
    [MaxLength(200)] public string DeviceModel { get; set; } = string.Empty;
    [MaxLength(2000)] public string IssueDescription { get; set; } = string.Empty;
    [MaxLength(500)] public string? PhotoPath { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Accepted;
    public decimal TotalCost { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrderComment> Comments { get; set; } = new List<OrderComment>();
    public ICollection<OrderPart> UsedParts { get; set; } = new List<OrderPart>();
}
