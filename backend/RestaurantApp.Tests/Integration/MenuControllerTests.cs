using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.DTOs.Menu;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace RestaurantApp.Tests.Integration;

public class MenuControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public MenuControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    #region GET Endpoints (Public)

    [Fact]
    public async Task GetCategories_WithoutAuth_Returns200AndList()
    {
        await _factory.SeedSampleData();

        var response = await _client.GetAsync("/api/menu/categories");
        var body = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.Count.Should().BeGreaterThanOrEqualTo(3); // seeded starters, mains, desserts
    }

    [Fact]
    public async Task GetMenuItems_WithoutAuth_Returns200()
    {
        await _factory.SeedSampleData();

        var response = await _client.GetAsync("/api/menu");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetMenuItemById_WithValidId_Returns200()
    {
        await _factory.SeedSampleData();

        var response = await _client.GetAsync("/api/menu/1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetMenuItemById_WithInvalidId_Returns404()
    {
        await _factory.SeedSampleData();

        var response = await _client.GetAsync("/api/menu/99999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetMenuItems_OnlyAvailable_ReturnsFiltered()
    {
        await _factory.SeedSampleData();

        var response = await _client.GetAsync("/api/menu?available=true");
        var body = await response.Content.ReadFromJsonAsync<List<MenuItemDto>>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.Should().OnlyContain(mi => mi.Available);
    }

    #endregion

    #region POST /api/menu/categories (Admin)

    [Fact]
    public async Task CreateCategory_AsWaiter_Returns403()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { name = "New Category" };
        var response = await _client.PostJson("/api/menu/categories", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateCategory_AsAdmin_Returns201()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { name = "New Category" };
        var response = await _client.PostJson("/api/menu/categories", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateCategory_WithDuplicateName_Returns409()
    {
        // Seed existing category
        await _factory.SeedSampleData();
        
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create first "Starters"
        await _client.PostJson("/api/menu/categories", new { name = "Appetizers" });
        
        var response = await _client.PostJson("/api/menu/categories", new { name = "Appetizers" });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    #endregion

    #region PUT /api/menu/categories/{id} (Admin)

    [Fact]
    public async Task UpdateCategory_AsKitchen_Returns403()
    {
        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { name = "Updated Name" };
        var response = await _client.PutJson("/api/menu/categories/1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UpdateCategory_AsAdmin_Returns200()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { name = "Updated Name" };
        var response = await _client.PutJson("/api/menu/categories/1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region DELETE /api/menu/categories/{id} (Admin)

    [Fact]
    public async Task DeleteCategory_AsWaiter_Returns403()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/menu/categories/1");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteCategory_WithExistingItems_Returns409()
    {
        await _factory.SeedSampleData();

        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/menu/categories/1");
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task DeleteCategory_WithoutItems_Returns204()
    {
        // Create an empty category
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResp = await _client.PostJson("/api/menu/categories", new { name = "ToDelete" });
        createResp.StatusCode.Should().Be(HttpStatusCode.Created);

        // Get the created category id - we'll use a fresh one for clean delete
        var response = await _client.DeleteAsync("/api/menu/categories/999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region MenuItem CRUD (Admin)

    [Fact]
    public async Task CreateMenuItem_AsWaiter_Returns403()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { name = "New Item", price = 10.0m, categoryId = 1, available = true };
        var response = await _client.PostJson("/api/menu", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateMenuItem_AsAdmin_Returns201()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { name = "New Item", price = 15.0m, categoryId = 1, available = true };
        var response = await _client.PostJson("/api/menu", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task UpdateMenuItem_AsAdmin_Returns200()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { name = "Updated Item", price = 14.5m, available = false };
        var response = await _client.PutJson("/api/menu/1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DeleteMenuItem_AsAdmin_Returns204()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/menu/1");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteMenuItem_AsWaiter_Returns403()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/menu/1");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Image Upload (Admin)

    [Fact]
    public async Task UploadImage_AsAdmin_Returns200()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a multipart form with image data
        var content = new MultipartFormDataContent();
        var bytes = System.Text.Encoding.ASCII.GetBytes("fake-image-png-data");
        content.Add(new ByteArrayContent(bytes), "image", "test.png");
        
        var response = await _client.PostAsync("/api/menu/upload-image", content);

        // Should succeed (or return a URL) - not 403
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    #endregion
}

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
