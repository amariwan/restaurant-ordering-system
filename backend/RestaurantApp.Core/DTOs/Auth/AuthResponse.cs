using RestaurantApp.Core.DTOs.Users;
using System.Text.Json.Serialization;

namespace RestaurantApp.Core.DTOs.Auth;

public class AuthResponse
{
    public required string Token { get; set; }
    public required UserDto User { get; set; }
    [JsonIgnore]
    public string? RefreshToken { get; set; }
}
