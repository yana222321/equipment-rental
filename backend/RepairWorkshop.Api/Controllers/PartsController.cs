using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RepairWorkshop.Api.Data;
using RepairWorkshop.Api.Dtos;
using RepairWorkshop.Api.Models;

namespace RepairWorkshop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PartsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PartDto>>> GetAll([FromQuery] string? search)
    {
        var q = db.Parts.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(s) || p.Sku.ToLower().Contains(s));
        }
        var items = await q.OrderBy(p => p.Id).Select(p => ToDto(p)).ToListAsync();
        return Ok(items);
    }

    [Authorize(Roles = $"{Roles.Admin},{Roles.Master}")]
    [HttpPost]
    public async Task<ActionResult<PartDto>> Create(PartRequest req)
    {
        var sku = req.Sku.Trim();
        if (await db.Parts.AnyAsync(p => p.Sku == sku))
            return Conflict(new { message = "Запчасть с таким артикулом уже существует" });
        var p = new Part { Name = req.Name.Trim(), Sku = sku, Category = req.Category?.Trim() ?? "", StockQuantity = req.StockQuantity, UnitPrice = req.UnitPrice, MinQuantity = req.MinQuantity };
        db.Parts.Add(p);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = p.Id }, ToDto(p));
    }

    [Authorize(Roles = $"{Roles.Admin},{Roles.Master}")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<PartDto>> Update(int id, PartRequest req)
    {
        var p = await db.Parts.FindAsync(id);
        if (p is null) return NotFound();
        var sku = req.Sku.Trim();
        if (await db.Parts.AnyAsync(x => x.Sku == sku && x.Id != id))
            return Conflict(new { message = "Запчасть с таким артикулом уже существует" });
        p.Name = req.Name.Trim(); p.Sku = sku; p.Category = req.Category?.Trim() ?? ""; p.StockQuantity = req.StockQuantity; p.UnitPrice = req.UnitPrice; p.MinQuantity = req.MinQuantity;
        await db.SaveChangesAsync();
        return Ok(ToDto(p));
    }

    [Authorize(Roles = $"{Roles.Admin},{Roles.Master}")]
    [HttpPost("{id:int}/adjust")]
    public async Task<ActionResult<PartDto>> AdjustStock(int id, StockAdjustRequest req)
    {
        var p = await db.Parts.FindAsync(id);
        if (p is null) return NotFound();
        var newQty = p.StockQuantity + req.Delta;
        if (newQty < 0) return BadRequest(new { message = "Недостаточно запчастей на складе" });
        p.StockQuantity = newQty;
        await db.SaveChangesAsync();
        return Ok(ToDto(p));
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await db.Parts.FindAsync(id);
        if (p is null) return NotFound();
        if (await db.OrderParts.AnyAsync(op => op.PartId == id))
            return Conflict(new { message = "Нельзя удалить запчасть, которая использовалась в заявках" });
        db.Parts.Remove(p);
        await db.SaveChangesAsync();
        return NoContent();
    }

    internal static PartDto ToDto(Part p) => new(p.Id, p.Name, p.Sku, p.Category, p.StockQuantity, p.UnitPrice, p.MinQuantity);
}
