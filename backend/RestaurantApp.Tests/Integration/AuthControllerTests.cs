using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.DTOs.Auth;
using RestaurantApp.Core.DTOs.Users;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace RestaurantApp.Tests.Integration;

public class AuthControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public AuthControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    #region Login Tests

    [Fact]
    public async Task Login_WithValidCredentials_Returns200AndToken()
    {
        // Arrange: seed user with known password hash $2a$12$abc123 (password = "pass")
        var db = _factory.CreateDbContext();
        await db.Users.AddAsync(new User
        {
            Name = "TestUser",
            Email = "login@test.com",
            PasswordHash = "$2a$12$LhE6yRnQ4LqJ9Z3k5vX7bN8pMxWzYcFdGhJiKlOpQrStUvWx", // "password"
            Role = UserRole.Waiter
        });
        await db.SaveChangesAsync();

        var payload = new { email = "login@test.com", password = "password" };

        // Act
        var response = await _client.PostJson("/api/auth/login", payload);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401()
    {
        // Arrange
        var db = _factory.CreateDbContext();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("correct_password");
        await db.Users.AddAsync(new User
        {
            Email = "wrong@test.com",
            PasswordHash = passwordHash,
            Role = UserRole.Waiter
        });
        await db.SaveChangesAsync();

        // Act
        var response = await _client.PostJson("/api/auth/login", new
        {
            email = "wrong@test.com",
            password = "wrong_password"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithNonExistentEmail_Returns401()
    {
        // Act
        var response = await _client.PostJson("/api/auth/login", new
        {
            email = "nobody@test.com",
            password = "anything"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithEmptyBody_Returns400()
    {
        // Act
        var response = await _client.PostJson("/api/auth/login", new { });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Register Tests

    [Fact]
    public async Task Register_WithValidData_Returns201()
    {
        // Act
        var response = await _client.PostJson("/api/auth/register", new
        {
            name = "New User",
            email = "new@test.com",
            password = "strongPass1!"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        body.Should().NotBeNull();
        body!.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        // Arrange: register first user
        await _client.PostJson("/api/auth/register", new
        {
            name = "First User",
            email = "dup@test.com",
            password = "pass123!"
        });

        // Act: try to register same email again
        var response = await _client.PostJson("/api/auth/register", new
        {
            name = "Second User",
            email = "dup@test.com",
            password = "pass456!"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_Returns400()
    {
        // Act
        var response = await _client.PostJson("/api/auth/register", new
        {
            name = "Bad Email",
            email = "not-an-email",
            password = "pass123!"
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithShortPassword_Returns400()
    {
        // Act
        var response = await _client.PostJson("/api/auth/register", new
        {
            name = "Short Pass",
            email = "short@test.com",
            password = "123" // too short
        });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Protected Endpoints

    [Fact]
    public async Task Me_WithoutToken_Returns401()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_WithValidAdminToken_Returns200WithUser()
    {
        // Arrange: create the user in DB so GetCurrentUserAsync can find them by ID
        var db = _factory.CreateDbContext();
        var user = new User
        {
            Name = "Admin User",
            Email = "me-admin@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("TestPass123!", 4),
            Role = UserRole.Admin
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("me-admin@test.com", UserRole.Admin, user.Id);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadFromJsonAsync<UserDto>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.Email.Should().Be("me-admin@test.com");
    }

    [Fact]
    public async Task Orders_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/orders");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Orders_WithWaiterToken_Returns200()
    {
        // Arrange
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/orders");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Public Endpoints

    [Fact]
    public async Task Categories_WithoutAuth_Returns200()
    {
        var response = await _client.GetAsync("/api/menu/categories");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task MenuItems_WithoutAuth_Returns200()
    {
        var response = await _client.GetAsync("/api/menu");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Logout

    [Fact]
    public async Task Logout_WithValidToken_Returns204()
    {
        // Arrange: first login to get cookies
        var loginResponse = await _client.PostJson("/api/auth/register", new
        {
            name = "Logout User",
            email = "logout@test.com",
            password = "pass123!"
        });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        // Act
        var response = await _client.PostAsync("/api/auth/logout", null!);

        // Assert - cookies should be deleted (empty content, no redirect)
        response.StatusCode.Should().BeOneOf(HttpStatusCode.NoContent, HttpStatusCode.OK);
    }

    #endregion
}

// Extension methods for JSON posting/putting in integration tests
internal static class HttpClientExtensions
{
    public static async Task<HttpResponseMessage> PostJson<T>(this HttpClient client, string url, T data)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(data);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await client.PostAsync(url, content);
    }

    public static async Task<HttpResponseMessage> PutJson<T>(this HttpClient client, string url, T data)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(data);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await client.PutAsync(url, content);
    }
}
