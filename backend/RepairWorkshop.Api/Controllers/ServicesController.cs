using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RepairWorkshop.Api.Data;
using RepairWorkshop.Api.Dtos;
using RepairWorkshop.Api.Models;

namespace RepairWorkshop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ServiceDto>>> GetAll([FromQuery] bool includeInactive = false)
    {
        var q = db.Services.AsNoTracking().AsQueryable();
        if (!includeInactive) q = q.Where(s => s.IsActive);
        var items = await q.OrderBy(s => s.Id).Select(s => ToDto(s)).ToListAsync();
        return Ok(items);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<ActionResult<ServiceDto>> Create(ServiceRequest req)
    {
        var s = new Service { Name = req.Name.Trim(), Category = req.Category.Trim(), BasePrice = req.BasePrice, EstimatedTime = req.EstimatedTime?.Trim() ?? "", IsActive = req.IsActive };
        db.Services.Add(s);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = s.Id }, ToDto(s));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ServiceDto>> Update(int id, ServiceRequest req)
    {
        var s = await db.Services.FindAsync(id);
        if (s is null) return NotFound();
        s.Name = req.Name.Trim(); s.Category = req.Category.Trim(); s.BasePrice = req.BasePrice; s.EstimatedTime = req.EstimatedTime?.Trim() ?? ""; s.IsActive = req.IsActive;
        await db.SaveChangesAsync();
        return Ok(ToDto(s));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await db.Services.FindAsync(id);
        if (s is null) return NotFound();
        db.Services.Remove(s);
        await db.SaveChangesAsync();
        return NoContent();
    }

    internal static ServiceDto ToDto(Service s) => new(s.Id, s.Name, s.Category, s.BasePrice, s.EstimatedTime, s.IsActive);
}
