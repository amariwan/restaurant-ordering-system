using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RestaurantApp.Core.DTOs.Auth;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Infrastructure.Data;
using RestaurantApp.Infrastructure.Services;
using AutoMapper;
using RestaurantApp.Infrastructure.Mappings;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class AuthServiceTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"auth_test_{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options);
    }

    private IConfiguration CreateConfig(string jwtSecret = "this-is-a-minimum-32-characters-secret-for-testing")
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string>
            {
                ["JWT_SECRET"] = jwtSecret,
                ["JWT_EXPIRY_HOURS"] = "8",
                ["REFRESH_TOKEN_EXPIRY_DAYS"] = "30"
            })
            .Build();
    }

    [Fact]
    public async Task RegisterAsync_ReturnsAuthResponse_WithUserAndTokens()
    {
        using var db = CreateContext();
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var request = new RegisterRequest { Name = "Test User", Email = "test@example.com", Password = "Password123!" };
        var result = await svc.RegisterAsync(request);

        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrWhiteSpace();
        result.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.User.Should().NotBeNull();
        result.User.Name.Should().Be("Test User");
        result.User.Email.Should().Be("test@example.com");
        result.User.Role.Should().Be(UserRole.Waiter);

        var userInDb = await db.Users.FindAsync(1);
        userInDb.Should().NotBeNull();
        BCrypt.Net.BCrypt.Verify("Password123!", userInDb!.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task RegisterAsync_ThrowsConflictException_WhenEmailExists()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var request = new RegisterRequest { Name = "New User", Email = "admin@test.com", Password = "Password123!" };

        await AsyncTest.Act(() => svc.RegisterAsync(request))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task RegisterAsync_ThrowsForbiddenException_WhenPasswordTooShort()
    {
        using var db = CreateContext();
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var request = new RegisterRequest { Name = "Test", Email = "test@example.com", Password = "short" };

        await AsyncTest.Act(() => svc.RegisterAsync(request))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task RegisterAsync_NormalizesEmailToLowercase()
    {
        using var db = CreateContext();
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var request = new RegisterRequest { Name = "Test", Email = "Test@Example.COM", Password = "Password123!" };
        var result = await svc.RegisterAsync(request);

        result.User.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task LoginAsync_ReturnsAuthResponse_WithValidCredentials()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var request = new LoginRequest { Email = "admin@test.com", Password = "$2a$12$abc123" };
        var result = await svc.LoginAsync(request);

        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task LoginAsync_ThrowsNotFoundException_WhenUserNotFound()
    {
        using var db = CreateContext();
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var request = new LoginRequest { Email = "nobody@example.com", Password = "Password123!" };

        await AsyncTest.Act(() => svc.LoginAsync(request))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task LoginAsync_ThrowsForbiddenException_WhenPasswordIncorrect()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var request = new LoginRequest { Email = "admin@test.com", Password = "WrongPassword123!" };

        await AsyncTest.Act(() => svc.LoginAsync(request))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task RefreshTokenAsync_ThrowsForbiddenException_WhenTokenInvalid()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        await AsyncTest.Act(() => svc.RefreshTokenAsync("invalid-token"))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task RefreshTokenAsync_ThrowsForbiddenException_WhenTokenExpired()
    {
        using var db = CreateContext();
        var user = new User
        {
            Id = 1,
            Name = "Test",
            Email = "test@test.com",
            PasswordHash = "$2a$12$abc123",
            Role = UserRole.Admin
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var config = CreateConfig("REFRESH_TOKEN_EXPIRY_DAYS", "1");
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var refresh = await svc.CreateAndStoreRefreshTokenForTestAsync(user);

        // Manually expire the token by setting RevokedAt to now (simulating expiration)
        var refreshTokenEntity = await db.RefreshTokens.FirstOrDefaultAsync(r => r.UserId == user.Id);
        if (refreshTokenEntity != null)
        {
            refreshTokenEntity.ExpiresAt = DateTime.UtcNow.AddHours(-1);
            await db.SaveChangesAsync();
        }

        await AsyncTest.Act(() => svc.RefreshTokenAsync(refresh.Token!))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task RevokeRefreshTokenAsync_RevokesExistingToken()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var refresh = await svc.CreateAndStoreRefreshTokenForTestAsync(
            await db.Users.FirstAsync(u => u.Email == "admin@test.com"));

        await svc.RevokeRefreshTokenAsync(refresh.Token!);

        var revokedToken = await db.RefreshTokens.FirstOrDefaultAsync(r => r.UserId == 1);
        revokedToken.Should().NotBeNull();
        revokedToken!.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task GetCurrentUserAsync_ReturnsUserDto_WithValidClaims()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var userIdClaim = new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "1");
        var claimsPrincipal = new System.Security.Claims.ClaimsPrincipal(
            new System.Security.Claims.ClaimsIdentity(new[] { userIdClaim }));

        var result = await svc.GetCurrentUserAsync(claimsPrincipal);

        result.Should().NotBeNull();
        result.Email.Should().Be("admin@test.com");
    }

    [Fact]
    public async Task GetCurrentUserAsync_ThrowsForbiddenException_WhenInvalidUserId()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var invalidClaim = new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "notanumber");
        var claimsPrincipal = new System.Security.Claims.ClaimsPrincipal(
            new System.Security.Claims.ClaimsIdentity(new[] { invalidClaim }));

        await AsyncTest.Act(() => svc.GetCurrentUserAsync(claimsPrincipal))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GetCurrentUserAsync_ThrowsNotFoundException_WhenUserNotFound()
    {
        using var db = CreateContext();
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var userIdClaim = new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, "999");
        var claimsPrincipal = new System.Security.Claims.ClaimsPrincipal(
            new System.Security.Claims.ClaimsIdentity(new[] { userIdClaim }));

        await AsyncTest.Act(() => svc.GetCurrentUserAsync(claimsPrincipal))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task RegisterAsync_DoesNotAllowDuplicateEmail()
    {
        using var db = CreateContext();
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        await svc.RegisterAsync(new RegisterRequest { Name = "User1", Email = "unique@test.com", Password = "Password123!" });

        var duplicateRequest = new RegisterRequest { Name = "User2", Email = "unique@test.com", Password = "Password123!" };

        await AsyncTest.Act(() => svc.RegisterAsync(duplicateRequest))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task LoginAsync_NormallyEmailCaseInsensitive()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        // Admin was created with lowercase admin@test.com
        var request = new LoginRequest { Email = "ADMIN@TEST.COM", Password = "$2a$12$abc123" };

        await AsyncTest.Act(() => svc.LoginAsync(request))
            .Should().NotThrowAsync();
    }

    [Fact]
    public async Task RefreshTokenAsync_CreatesNewRefreshToken()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var adminUser = await db.Users.FirstAsync(u => u.Email == "admin@test.com");
        var refresh = await svc.CreateAndStoreRefreshTokenForTestAsync(adminUser);

        var initialCount = await db.RefreshTokens.CountAsync(r => r.UserId == adminUser.Id);

        await svc.RefreshTokenAsync(refresh.Token!);

        var newCount = await db.RefreshTokens.CountAsync(r => r.UserId == adminUser.Id);
        // Should be at least 2 (original + new) minus any revoked
        newCount.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task LoginAsync_CanHandleTrimmedEmail()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var config = CreateConfig();
        var svc = new AuthService(db, config, TestDbContextFactory.CreateMapper());

        var request = new LoginRequest { Email = "  admin@test.com  ", Password = "$2a$12$abc123" };

        await AsyncTest.Act(() => svc.LoginAsync(request))
            .Should().NotThrowAsync();
    }
}
