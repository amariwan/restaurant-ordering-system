namespace RestaurantApp.Core.DTOs.Auth;

public class ChangePasswordRequest
{
    public required string CurrentPassword { get; init; }
    public required string NewPassword { get; init; }
}
