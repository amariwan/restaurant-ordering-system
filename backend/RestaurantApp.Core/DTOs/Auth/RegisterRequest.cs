using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Auth;

public class RegisterRequest
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
}
