namespace RestaurantApp.Core.DTOs.Auth;

public class UpdateProfileRequest
{
    public required string Name { get; init; }
    public required string Email { get; init; }
}
