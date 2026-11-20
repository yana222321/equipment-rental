using System.Security.Claims;
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
public class OrdersController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetAll([FromQuery] string? status, [FromQuery] string? search, [FromQuery] int? masterId)
    {
        var userId = User.GetUserId();
        var role = User.GetUserRole();
        if (userId is null || role is null) return Unauthorized();

        IQueryable<RepairOrder> q = db.RepairOrders
            .AsNoTracking()
            .Include(o => o.Client)
            .Include(o => o.Master)
            .Include(o => o.Comments).ThenInclude(c => c.Author)
            .Include(o => o.UsedParts).ThenInclude(up => up.Part);

        if (role == Roles.Client) q = q.Where(o => o.ClientId == userId.Value);
        else if (role == Roles.Master) q = q.Where(o => o.MasterId == userId.Value);
        // Admin sees all

        if (!string.IsNullOrWhiteSpace(status) && StatusMapper.TryParse(status, out var st))
            q = q.Where(o => o.Status == st);
        if (masterId.HasValue) q = q.Where(o => o.MasterId == masterId.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(o => o.Id.ToString().Contains(s)
                || o.DeviceModel.ToLower().Contains(s)
                || o.DeviceType.ToLower().Contains(s)
                || o.Client.FullName.ToLower().Contains(s)
                || o.IssueDescription.ToLower().Contains(s));
        }

        var items = await q.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(items.Select(ToDto));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await LoadFull(id);
        if (order is null) return NotFound();
        if (!CanAccess(order)) return Forbid();
        return Ok(ToDto(order));
    }

    [HttpPost]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<OrderDto>> Create([FromForm] CreateOrderForm form)
    {
        var userId = User.GetUserId();
        var role = User.GetUserRole();
        if (userId is null || role is null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(form.DeviceModel) || string.IsNullOrWhiteSpace(form.IssueDescription))
            return BadRequest(new { message = "Укажите модель устройства и описание неисправности" });

        int clientId;
        if (role == Roles.Client)
        {
            clientId = userId.Value;
        }
        else
        {
            if (!form.ClientId.HasValue) return BadRequest(new { message = "Укажите клиента" });
            if (!await db.Users.AnyAsync(u => u.Id == form.ClientId.Value && u.Role == Roles.Client))
                return BadRequest(new { message = "Клиент не найден" });
            clientId = form.ClientId.Value;
        }

        int? masterId = null;
        if (form.MasterId.HasValue)
        {
            if (role == Roles.Master) return Forbid();
            if (!await db.Users.AnyAsync(u => u.Id == form.MasterId.Value && u.Role == Roles.Master))
                return BadRequest(new { message = "Мастер не найден" });
            masterId = form.MasterId.Value;
        }

        var order = new RepairOrder
        {
            ClientId = clientId,
            MasterId = masterId,
            DeviceType = form.DeviceType?.Trim() ?? "",
            DeviceModel = form.DeviceModel.Trim(),
            IssueDescription = form.IssueDescription.Trim(),
            Status = OrderStatus.Accepted,
            TotalCost = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (form.Photo is { Length: > 0 })
        {
            var saved = await SavePhoto(form.Photo);
            if (saved.Error is not null) return BadRequest(new { message = saved.Error });
            order.PhotoPath = saved.Path;
        }

        db.RepairOrders.Add(order);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ToDto(await LoadFull(order.Id) ?? order));
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Master}")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, OrderStatusUpdateRequest req)
    {
        var order = await db.RepairOrders.FindAsync(id);
        if (order is null) return NotFound();
        if (!CanManage(order)) return Forbid();
        if (!StatusMapper.TryParse(req.Status, out var st)) return BadRequest(new { message = "Недопустимый статус" });
        order.Status = st;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ToDto(await LoadFull(id) ?? order));
    }

    [HttpPatch("{id:int}/assign")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<OrderDto>> Assign(int id, OrderAssignRequest req)
    {
        var order = await db.RepairOrders.FindAsync(id);
        if (order is null) return NotFound();
        if (req.MasterId.HasValue)
        {
            if (!await db.Users.AnyAsync(u => u.Id == req.MasterId.Value && u.Role == Roles.Master))
                return BadRequest(new { message = "Мастер не найден" });
            order.MasterId = req.MasterId.Value;
        }
        else order.MasterId = null;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ToDto(await LoadFull(id) ?? order));
    }

    [HttpPost("{id:int}/comments")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Master}")]
    public async Task<ActionResult<OrderDto>> AddComment(int id, OrderCommentRequest req)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var order = await db.RepairOrders.FindAsync(id);
        if (order is null) return NotFound();
        if (!CanManage(order)) return Forbid();
        if (string.IsNullOrWhiteSpace(req.Text)) return BadRequest(new { message = "Комментарий не может быть пустым" });
        db.OrderComments.Add(new OrderComment { OrderId = id, AuthorId = userId.Value, Text = req.Text.Trim(), CreatedAt = DateTime.UtcNow });
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ToDto(await LoadFull(id) ?? order));
    }

    [HttpPatch("{id:int}/cost")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Master}")]
    public async Task<ActionResult<OrderDto>> SetCost(int id, OrderCostRequest req)
    {
        var order = await db.RepairOrders.FindAsync(id);
        if (order is null) return NotFound();
        if (!CanManage(order)) return Forbid();
        order.TotalCost = req.TotalCost;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ToDto(await LoadFull(id) ?? order));
    }

    [HttpPost("{id:int}/parts")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Master}")]
    public async Task<ActionResult<OrderDto>> UsePart(int id, UsePartRequest req)
    {
        var order = await db.RepairOrders.FindAsync(id);
        if (order is null) return NotFound();
        if (!CanManage(order)) return Forbid();
        var part = await db.Parts.FindAsync(req.PartId);
        if (part is null) return BadRequest(new { message = "Запчасть не найдена" });
        if (part.StockQuantity < req.Quantity) return BadRequest(new { message = "Недостаточно запчастей на складе" });

        part.StockQuantity -= req.Quantity;
        db.OrderParts.Add(new OrderPart { OrderId = id, PartId = part.Id, Quantity = req.Quantity, UnitPrice = part.UnitPrice });
        order.TotalCost += part.UnitPrice * req.Quantity;
        order.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ToDto(await LoadFull(id) ?? order));
    }

    [HttpGet("statuses")]
    [AllowAnonymous]
    public ActionResult<IEnumerable<string>> Statuses() => Ok(StatusMapper.Labels);

    private async Task<RepairOrder?> LoadFull(int id) => await db.RepairOrders
        .Include(o => o.Client).Include(o => o.Master)
        .Include(o => o.Comments).ThenInclude(c => c.Author)
        .Include(o => o.UsedParts).ThenInclude(up => up.Part)
        .FirstOrDefaultAsync(o => o.Id == id);

    private bool CanAccess(RepairOrder order)
    {
        var role = User.GetUserRole();
        var uid = User.GetUserId();
        if (role == Roles.Admin) return true;
        if (role == Roles.Client) return order.ClientId == uid;
        if (role == Roles.Master) return order.MasterId == uid;
        return false;
    }

    private bool CanManage(RepairOrder order)
    {
        var role = User.GetUserRole();
        var uid = User.GetUserId();
        if (role == Roles.Admin) return true;
        if (role == Roles.Master) return order.MasterId == uid;
        return false;
    }

    private async Task<(string? Path, string? Error)> SavePhoto(IFormFile file)
    {
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext)) return (null, "Допустимые форматы фото: JPG, PNG, WEBP");
        if (file.Length > 5 * 1024 * 1024) return (null, "Размер фото не должен превышать 5 МБ");
        var uploads = Path.Combine(env.ContentRootPath, "Uploads");
        Directory.CreateDirectory(uploads);
        var name = $"{Guid.NewGuid():N}{ext}";
        var full = Path.Combine(uploads, name);
        await using var stream = System.IO.File.Create(full);
        await file.CopyToAsync(stream);
        return ($"/uploads/{name}", null);
    }

    private OrderDto ToDto(RepairOrder o) => new(
        o.Id,
        o.Client?.FullName ?? "",
        o.Client?.Phone,
        o.DeviceType,
        o.DeviceModel,
        o.IssueDescription,
        o.PhotoPath,
        o.Status.ToLabel(),
        o.Master?.FullName,
        o.MasterId,
        o.TotalCost,
        o.CreatedAt,
        o.UpdatedAt,
        o.Comments.OrderBy(c => c.CreatedAt).Select(c => new CommentDto(c.Id, c.Text, c.Author?.FullName ?? "", c.CreatedAt)).ToList(),
        o.UsedParts.Select(up => new UsedPartDto(up.Id, up.Part?.Name ?? "", up.Part?.Sku ?? "", up.Quantity, up.UnitPrice)).ToList()
    );
}

public class CreateOrderForm
{
    public int? ClientId { get; set; }
    public int? MasterId { get; set; }
    public string? DeviceType { get; set; }
    public string DeviceModel { get; set; } = string.Empty;
    public string IssueDescription { get; set; } = string.Empty;
    public IFormFile? Photo { get; set; }
}
