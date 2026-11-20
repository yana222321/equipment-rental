using System.ComponentModel.DataAnnotations;

namespace RepairWorkshop.Api.Models;

public class Part
{
    public int Id { get; set; }
    [MaxLength(200)] public string Name { get; set; } = string.Empty;
    [MaxLength(60)] public string Sku { get; set; } = string.Empty;
    [MaxLength(120)] public string Category { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public decimal UnitPrice { get; set; }
    public int MinQuantity { get; set; } = 2;

    public ICollection<OrderPart> OrderParts { get; set; } = new List<OrderPart>();
}
