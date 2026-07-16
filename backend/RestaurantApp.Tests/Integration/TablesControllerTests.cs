using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.DTOs.Tables;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace RestaurantApp.Tests.Integration;

public class TablesControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public TablesControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    #region GET /api/tables (Public)

    [Fact]
    public async Task GetAllTables_WithoutAuth_Returns200()
    {
        await _factory.SeedSampleData();
        var response = await _client.GetAsync("/api/tables");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllTables_ReturnsFreeAndOccupied()
    {
        await _factory.SeedSampleData();
        var response = await _client.GetAsync("/api/tables");
        var body = await response.Content.ReadFromJsonAsync<List<TableDto>>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.Should().Contain(t => t.Status == TableStatus.Free);
        body.Should().Contain(t => t.Status == TableStatus.Occupied);
    }

    #endregion

    #region POST /api/tables (Admin)

    [Fact]
    public async Task CreateTable_AsWaiter_Returns403()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { number = 10 };
        var response = await _client.PostJson("/api/tables", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateTable_AsAdmin_Returns201()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { number = 10 };
        var response = await _client.PostJson("/api/tables", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    #endregion

    #region PUT /api/tables/{id} (Admin)

    [Fact]
    public async Task UpdateTableStatus_ChangeFreeToOccupied()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { number = 1, status = "Occupied" };
        var response = await _client.PutJson("/api/tables/1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateTableStatus_InvalidValue_Returns400()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { number = 1, status = "Invalid" };
        var response = await _client.PutJson("/api/tables/1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateTableStatus_WithNonExistentId_Returns404()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { number = 1, status = "Free" };
        var response = await _client.PutJson("/api/tables/99999", payload);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region DELETE /api/tables/{id} (Admin)

    [Fact]
    public async Task DeleteTable_AsAdmin_FreeTable_Returns204()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Table 1 is Free from SeedData
        var response = await _client.DeleteAsync("/api/tables/1");
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteTable_AsAdmin_OccupiedTable_Returns409()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Table 2 is Occupied from SeedData
        var response = await _client.DeleteAsync("/api/tables/2");
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    #endregion
}

