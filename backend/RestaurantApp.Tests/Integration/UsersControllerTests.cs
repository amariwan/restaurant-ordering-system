using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.DTOs.Users;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace RestaurantApp.Tests.Integration;

public class UsersControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public UsersControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    #region GET /api/users Tests

    [Fact]
    public async Task GetAllUsers_AsAdmin_Returns200AndList()
    {
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/users");
        var body = await response.Content.ReadFromJsonAsync<List<UserDto>>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.Count.Should().BeGreaterThanOrEqualTo(2); // seeded admin + waiter
    }

    [Fact]
    public async Task GetAllUsers_AsWaiter_Returns403()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/users");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region PUT /api/users/{id} Tests

    [Fact]
    public async Task UpdateUser_RoleChange_AsAdmin_Returns200()
    {
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Waiter → Kitchen
        var payload = new { role = "Kitchen" };
        var response = await _client.PutJson("/api/users/2", payload);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateUser_AsWaiter_Returns403()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { role = "Kitchen" };
        var response = await _client.PutJson("/api/users/1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region DELETE /api/users/{id} Tests

    [Fact]
    public async Task DeleteUser_AsAdmin_Returns204()
    {
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/users/2");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteAdminUser_AsAdmin_Returns400()
    {
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Trying to delete the seeded admin (id=1)
        var response = await _client.DeleteAsync("/api/users/1");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteUser_WithNonExistentId_Returns404()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/users/99999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion
}

internal static class HttpClientExtensions
{
    public static async Task<HttpResponseMessage> PutJson<T>(this HttpClient client, string url, T data)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(data);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        return await client.PutAsync(url, content);
    }
}
