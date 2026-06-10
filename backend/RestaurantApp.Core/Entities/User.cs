using RestaurantApp.Core.Common;

namespace RestaurantApp.Core.Entities;

public class User : BaseEntity, IAuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Core.Enums.UserRole Role { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public List<RefreshToken> RefreshTokens { get; set; } = [];
}
