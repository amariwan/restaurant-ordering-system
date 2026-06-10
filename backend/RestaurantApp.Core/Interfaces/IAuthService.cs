using RestaurantApp.Core.DTOs.Auth;
using RestaurantApp.Core.DTOs.Users;
using System.Security.Claims;

namespace RestaurantApp.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<UserDto> GetCurrentUserAsync(ClaimsPrincipal user);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task RevokeRefreshTokenAsync(string refreshToken);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request);
    Task<UserDto> ChangePasswordAsync(int userId, ChangePasswordRequest request);
}
