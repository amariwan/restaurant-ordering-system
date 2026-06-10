using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace RestaurantApp.Tests.Integration;

public class UsersControllerSupplementaryTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public UsersControllerSupplementaryTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    #region Auth tests

    [Fact]
    public async Task GetAllUsers_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/users");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateUser_WithoutAuth_Returns401()
    {
        var payload = new { role = "Kitchen" };
        var response = await _client.PutJson("/api/users/1", payload);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteUser_WithoutAuth_Returns401()
    {
        var response = await _client.DeleteAsync("/api/users/1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAllUsers_AsKitchen_Returns403()
    {
        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/users");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UpdateUser_AsKitchen_Returns403()
    {
        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { role = "Admin" };
        var response = await _client.PutJson("/api/users/1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteUser_AsKitchen_Returns403()
    {
        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/users/1");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Edge case tests

    [Fact]
    public async Task UpdateUser_NonExistentUser_Returns404()
    {
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { role = "Kitchen" };
        var response = await _client.PutJson("/api/users/99999", payload);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateUser_InvalidRole_Returns400()
    {
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { role = "NonExistentRole" };
        var response = await _client.PutJson("/api/users/2", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion
}
