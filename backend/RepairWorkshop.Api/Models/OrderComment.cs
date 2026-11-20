using System.ComponentModel.DataAnnotations;

namespace RepairWorkshop.Api.Models;

public class OrderComment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public RepairOrder Order { get; set; } = null!;
    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
    [MaxLength(2000)] public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
