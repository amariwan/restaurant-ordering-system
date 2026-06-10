namespace RestaurantApp.Core.DTOs.Users;

public class UserUpdateRequest
{
    public required string Name { get; init; }
    public required string Email { get; init; }
    public required string Role { get; init; }
}
