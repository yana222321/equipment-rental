using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RepairWorkshop.Api.Data;
using RepairWorkshop.Api.Dtos;
using RepairWorkshop.Api.Models;

namespace RepairWorkshop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController(AppDbContext db) : ControllerBase
{
    [Authorize(Roles = Roles.Admin)]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll([FromQuery] string? role)
    {
        var q = db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(role)) q = q.Where(u => u.Role == role);
        var items = await q.OrderBy(u => u.Id).Select(u => AuthController.ToUserDto(u)).ToListAsync();
        return Ok(items);
    }

    [Authorize]
    [HttpGet("masters")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetMasters()
    {
        var items = await db.Users.AsNoTracking().Where(u => u.Role == Roles.Master)
            .OrderBy(u => u.FullName).Select(u => AuthController.ToUserDto(u)).ToListAsync();
        return Ok(items);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPatch("{id:int}/role")]
    public async Task<ActionResult<UserDto>> SetRole(int id, UserRoleRequest req)
    {
        var allowed = new[] { Roles.Client, Roles.Master, Roles.Admin };
        if (!allowed.Contains(req.Role)) return BadRequest(new { message = "Недопустимая роль" });
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        user.Role = req.Role;
        await db.SaveChangesAsync();
        return Ok(AuthController.ToUserDto(user));
    }
}
