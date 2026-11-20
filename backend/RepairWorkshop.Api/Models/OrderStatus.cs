namespace RepairWorkshop.Api.Models;

public enum OrderStatus
{
    Accepted = 0,
    Diagnosing = 1,
    InRepair = 2,
    ReadyForPickup = 3,
    Issued = 4
}
