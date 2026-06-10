using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace RestaurantApp.Tests.Integration;

public class TablesControllerSupplementaryTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public TablesControllerSupplementaryTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    #region Auth tests

    [Fact]
    public async Task CreateTable_WithoutAuth_Returns401()
    {
        var payload = new { number = 10 };
        var response = await _client.PostJson("/api/tables", payload);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateTable_WithoutAuth_Returns401()
    {
        var payload = new { status = "Free" };
        var response = await _client.PutJson("/api/tables/1", payload);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteTable_WithoutAuth_Returns401()
    {
        var response = await _client.DeleteAsync("/api/tables/1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateTable_AsKitchen_Returns403()
    {
        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { number = 10 };
        var response = await _client.PostJson("/api/tables", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UpdateTable_AsWaiter_Returns403()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { status = "Free" };
        var response = await _client.PutJson("/api/tables/1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteTable_AsWaiter_Returns403()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/tables/1");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Edge case tests

    [Fact]
    public async Task DeleteTable_NonExistent_Returns404()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/tables/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateTable_DuplicateNumber_Returns409()
    {
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { number = 1 };
        var response = await _client.PostJson("/api/tables", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreateTable_WithZeroNumber_Returns400()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { number = 0 };
        var response = await _client.PostJson("/api/tables", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion
}
