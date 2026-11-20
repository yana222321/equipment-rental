using System.ComponentModel.DataAnnotations;

namespace RepairWorkshop.Api.Dtos;

public record RegisterRequest(
    [Required, MaxLength(120)] string FullName,
    [Required, EmailAddress, MaxLength(200)] string Email,
    [MaxLength(30)] string? Phone,
    [Required, MinLength(6), MaxLength(100)] string Password);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record UserDto(int Id, string FullName, string Email, string? Phone, string Role, DateTime CreatedAt);
public record AuthResponse(string Token, UserDto User);

public record ServiceDto(int Id, string Name, string Category, decimal BasePrice, string EstimatedTime, bool IsActive);
public record ServiceRequest([Required, MaxLength(200)] string Name, [Required, MaxLength(120)] string Category, [Range(0, 1000000)] decimal BasePrice, [MaxLength(80)] string EstimatedTime, bool IsActive = true);

public record PartDto(int Id, string Name, string Sku, string Category, int StockQuantity, decimal UnitPrice, int MinQuantity);
public record PartRequest([Required, MaxLength(200)] string Name, [Required, MaxLength(60)] string Sku, [MaxLength(120)] string Category, [Range(0, 100000)] int StockQuantity, [Range(0, 1000000)] decimal UnitPrice, [Range(0, 100000)] int MinQuantity = 2);
public record StockAdjustRequest([Range(-100000, 100000)] int Delta);

public record CommentDto(int Id, string Text, string AuthorName, DateTime CreatedAt);
public record UsedPartDto(int Id, string Name, string Sku, int Quantity, decimal UnitPrice);

public record OrderDto(
    int Id, string ClientName, string? ClientPhone, string DeviceType, string DeviceModel,
    string IssueDescription, string? PhotoUrl, string Status, string? MasterName, int? MasterId,
    decimal TotalCost, DateTime CreatedAt, DateTime UpdatedAt,
    List<CommentDto> Comments, List<UsedPartDto> UsedParts);

public record OrderStatusUpdateRequest([Required] string Status);
public record OrderAssignRequest(int? MasterId);
public record OrderCommentRequest([Required, MaxLength(2000)] string Text);
public record OrderCostRequest([Range(0, 1000000)] decimal TotalCost);
public record UsePartRequest([Required] int PartId, [Range(1, 10000)] int Quantity = 1);
public record UserRoleRequest([Required] string Role);
