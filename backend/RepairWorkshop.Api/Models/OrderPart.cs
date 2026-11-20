namespace RepairWorkshop.Api.Models;

public class OrderPart
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public RepairOrder Order { get; set; } = null!;
    public int PartId { get; set; }
    public Part Part { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
