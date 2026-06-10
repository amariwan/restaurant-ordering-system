using System.Security.Claims;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;

namespace RestaurantApp.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(claim, out var id))
            throw new UnauthorizedAccessException("Invalid user ID in claims");
        return id;
    }

    public static UserRole GetUserRole(this ClaimsPrincipal user)
    {
        var claim = user.FindFirstValue(ClaimTypes.Role);
        if (!Enum.TryParse<UserRole>(claim, true, out var role))
            throw new ForbiddenException($"Invalid user role in claims: {claim}");
        return role;
    }
}
