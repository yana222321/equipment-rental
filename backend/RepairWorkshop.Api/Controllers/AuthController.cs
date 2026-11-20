using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RepairWorkshop.Api.Data;
using RepairWorkshop.Api.Dtos;
using RepairWorkshop.Api.Models;
using RepairWorkshop.Api.Services;

namespace RepairWorkshop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, JwtTokenService jwt) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "Пользователь с таким email уже существует" });

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = request.Phone?.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = Roles.Client
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Ok(ToAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Неверный email или пароль" });
        return Ok(ToAuthResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var id = User.GetUserId();
        if (id is null) return Unauthorized();
        var user = await db.Users.FindAsync(id.Value);
        return user is null ? Unauthorized() : Ok(ToUserDto(user));
    }

    private AuthResponse ToAuthResponse(User user) => new(jwt.CreateToken(user), ToUserDto(user));
    internal static UserDto ToUserDto(User user) => new(user.Id, user.FullName, user.Email, user.Phone, user.Role, user.CreatedAt);
}
