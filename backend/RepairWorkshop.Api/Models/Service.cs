using System.ComponentModel.DataAnnotations;

namespace RepairWorkshop.Api.Models;

public class Service
{
    public int Id { get; set; }
    [MaxLength(200)] public string Name { get; set; } = string.Empty;
    [MaxLength(120)] public string Category { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    [MaxLength(80)] public string EstimatedTime { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
