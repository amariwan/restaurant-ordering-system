using System.Security.Claims;
using FluentAssertions;
using RestaurantApp.API.Extensions;
using RestaurantApp.Core.Enums;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class ClaimsPrincipalExtensionsTests
{
    [Fact]
    public void GetUserId_WithValidClaim_ReturnsId()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "42")
        }));

        var id = user.GetUserId();

        id.Should().Be(42);
    }

    [Fact]
    public void GetUserId_WithoutClaim_ThrowsUnauthorizedAccessException()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity());

        var act = () => user.GetUserId();

        act.Should().Throw<UnauthorizedAccessException>().WithMessage("*user ID*");
    }

    [Fact]
    public void GetUserId_WithNonNumericClaim_ThrowsUnauthorizedAccessException()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "not-a-number")
        }));

        var act = () => user.GetUserId();

        act.Should().Throw<UnauthorizedAccessException>().WithMessage("*user ID*");
    }

    [Fact]
    public void GetUserRole_WithValidClaim_ReturnsRole()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "Waiter")
        }));

        var role = user.GetUserRole();

        role.Should().Be(UserRole.Waiter);
    }

    [Fact]
    public void GetUserRole_WithAdminClaim_ReturnsAdmin()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "Admin")
        }));

        var role = user.GetUserRole();

        role.Should().Be(UserRole.Admin);
    }

    [Fact]
    public void GetUserRole_WithKitchenClaim_ReturnsKitchen()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "Kitchen")
        }));

        var role = user.GetUserRole();

        role.Should().Be(UserRole.Kitchen);
    }

    [Fact]
    public void GetUserRole_WithInvalidClaim_ThrowsForbiddenException()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "InvalidRole")
        }));

        var act = () => user.GetUserRole();

        act.Should().Throw<Core.Exceptions.ForbiddenException>().WithMessage("*InvalidRole*");
    }

    [Fact]
    public void GetUserRole_WithoutClaim_ThrowsForbiddenException()
    {
        var user = new ClaimsPrincipal(new ClaimsIdentity());

        var act = () => user.GetUserRole();

        act.Should().Throw<Core.Exceptions.ForbiddenException>();
    }
}
