using System.Security.Claims;

namespace RepairWorkshop.Api;

public static class ClaimsExtensions
{
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var v = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return int.TryParse(v, out var id) ? id : null;
    }
    public static string? GetUserRole(this ClaimsPrincipal user) => user.FindFirstValue(ClaimTypes.Role);
}
