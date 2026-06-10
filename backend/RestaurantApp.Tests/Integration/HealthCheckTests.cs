using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using Xunit;

namespace RestaurantApp.Tests.Integration;

public class HealthCheckTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public HealthCheckTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    [Fact]
    public async Task Get_Root_ReturnsSuccess()
    {
        var response = await _client.GetAsync("/");

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Get_MenuItems_WithoutAuth_Returns200()
    {
        var response = await _client.GetAsync("/api/menu");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Get_Categories_WithoutAuth_Returns200()
    {
        var response = await _client.GetAsync("/api/menu/categories");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Get_Tables_WithoutAuth_Returns200()
    {
        var response = await _client.GetAsync("/api/tables");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Get_Orders_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/orders");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_AuthMe_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_Users_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/users");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_ApiHealth_ReturnsExpectedStatus()
    {
        var publicEndpoints = new[] { "/api/menu", "/api/tables", "/api/menu/categories" };

        foreach (var endpoint in publicEndpoints)
        {
            var response = await _client.GetAsync(endpoint);
            response.StatusCode.Should().Be(HttpStatusCode.OK, $"endpoint {endpoint} should be public");
        }
    }

    [Fact]
    public async Task Get_SwaggerEndpoint_Returns200()
    {
        var response = await _client.GetAsync("/swagger/v1/swagger.json");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Get_NonexistentEndpoint_Returns404()
    {
        var response = await _client.GetAsync("/api/nonexistent");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
