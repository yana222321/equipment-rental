using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RepairWorkshop.Api.Data;
using RepairWorkshop.Api.Models;

namespace RepairWorkshop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Admin)]
public class StatsController(AppDbContext db) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<object>> Summary([FromQuery] string period = "week")
    {
        var (from, to) = PeriodRange(period);
        var orders = db.RepairOrders.AsNoTracking().Where(o => o.CreatedAt >= from && o.CreatedAt <= to);

        var total = await orders.CountAsync();
        var inWork = await orders.CountAsync(o => o.Status == OrderStatus.Diagnosing || o.Status == OrderStatus.InRepair);
        var ready = await orders.CountAsync(o => o.Status == OrderStatus.ReadyForPickup);
        var issued = await orders.CountAsync(o => o.Status == OrderStatus.Issued);
        var revenue = await orders.Where(o => o.Status == OrderStatus.Issued || o.Status == OrderStatus.ReadyForPickup).SumAsync(o => (decimal?)o.TotalCost) ?? 0;

        return Ok(new { period, from, to, total, inWork, ready, issued, revenue });
    }

    [HttpGet("by-status")]
    public async Task<ActionResult<object>> ByStatus([FromQuery] string period = "week")
    {
        var (from, to) = PeriodRange(period);
        var raw = await db.RepairOrders.AsNoTracking()
            .Where(o => o.CreatedAt >= from && o.CreatedAt <= to)
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();
        var result = raw.Select(x => new { status = x.Status.ToLabel(), count = x.Count }).ToList();
        return Ok(result);
    }

    [HttpGet("by-device-type")]
    public async Task<ActionResult<object>> ByDeviceType([FromQuery] string period = "month")
    {
        var (from, to) = PeriodRange(period);
        var raw = await db.RepairOrders.AsNoTracking()
            .Where(o => o.CreatedAt >= from && o.CreatedAt <= to)
            .GroupBy(o => o.DeviceType)
            .Select(g => new { deviceType = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();
        return Ok(raw);
    }

    [HttpGet("masters-workload")]
    public async Task<ActionResult<object>> MastersWorkload()
    {
        var masters = await db.Users.AsNoTracking().Where(u => u.Role == Roles.Master)
            .Select(m => new
            {
                masterId = m.Id,
                name = m.FullName,
                activeOrders = db.RepairOrders.Count(o => o.MasterId == m.Id && o.Status != OrderStatus.Issued),
                completedOrders = db.RepairOrders.Count(o => o.MasterId == m.Id && o.Status == OrderStatus.Issued)
            }).ToListAsync();
        return Ok(masters);
    }

    [HttpGet("daily")]
    public async Task<ActionResult<object>> Daily([FromQuery] int days = 7)
    {
        days = Math.Clamp(days, 1, 90);
        var from = DateTime.UtcNow.Date.AddDays(-days + 1);
        var raw = await db.RepairOrders.AsNoTracking()
            .Where(o => o.CreatedAt >= from)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new { date = g.Key, count = g.Count(), revenue = g.Sum(x => x.TotalCost) })
            .OrderBy(x => x.date)
            .ToListAsync();
        return Ok(raw);
    }

    private static (DateTime from, DateTime to) PeriodRange(string period)
    {
        var to = DateTime.UtcNow;
        var from = period.ToLowerInvariant() switch
        {
            "today" => DateTime.UtcNow.Date,
            "month" => DateTime.UtcNow.Date.AddDays(-30),
            _ => DateTime.UtcNow.Date.AddDays(-7) // week
        };
        return (from, to);
    }
}
