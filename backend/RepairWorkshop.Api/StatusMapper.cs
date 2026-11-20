using RepairWorkshop.Api.Models;

namespace RepairWorkshop.Api;

public static class StatusMapper
{
    private static readonly (OrderStatus Value, string Label)[] Map =
    [
        (OrderStatus.Accepted, "Принята"),
        (OrderStatus.Diagnosing, "В диагностике"),
        (OrderStatus.InRepair, "В ремонте"),
        (OrderStatus.ReadyForPickup, "Готова к выдаче"),
        (OrderStatus.Issued, "Выдана")
    ];

    public static string ToLabel(this OrderStatus status) => Map.First(m => m.Value == status).Label;

    public static bool TryParse(string? label, out OrderStatus status)
    {
        var m = Map.FirstOrDefault(x => string.Equals(x.Label, label, StringComparison.OrdinalIgnoreCase)
            || string.Equals(x.Value.ToString(), label, StringComparison.OrdinalIgnoreCase));
        if (m.Label is null) { status = default; return false; }
        status = m.Value; return true;
    }

    public static IReadOnlyList<string> Labels => Map.Select(m => m.Label).ToList();
}
