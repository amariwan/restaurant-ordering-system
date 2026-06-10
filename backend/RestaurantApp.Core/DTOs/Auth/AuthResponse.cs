using System.Text.Json.Serialization;

using RestaurantApp.Core.DTOs.Users;

namespace RestaurantApp.Core.DTOs.Auth;

public class AuthResponse
{
    public required string Token { get; set; }
    public required UserDto User { get; set; }
    [JsonIgnore]
    public string? RefreshToken { get; set; }
}
