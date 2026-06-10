using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.DTOs.Payments;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace RestaurantApp.Tests.Integration;

public class PaymentsControllerSupplementaryTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public PaymentsControllerSupplementaryTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    #region Auth tests

    [Fact]
    public async Task CreatePayment_WithoutAuth_Returns401()
    {
        var response = await _client.PostAsync("/api/payments?orderId=1", new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetPayments_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/payments/1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreatePayment_AsKitchen_Returns403()
    {
        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { amount = 10.0m, method = "Cash" };
        var response = await _client.PostJson("/api/payments?orderId=1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetPayments_AsKitchen_Returns403()
    {
        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/payments/1");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Validation tests

    [Fact]
    public async Task CreatePayment_WithZeroAmount_Returns400()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1 };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { amount = 0.0m, method = "Cash" };
        var response = await _client.PostJson($"/api/payments?orderId={order.Id}", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreatePayment_WithNegativeAmount_Returns400()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1 };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { amount = -10.0m, method = "Cash" };
        var response = await _client.PostJson($"/api/payments?orderId={order.Id}", payload);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Edge case tests

    [Fact]
    public async Task GetPayments_WithNoPayments_ReturnsEmptyList()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1 };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync($"/api/payments/{order.Id}");
        var body = await response.Content.ReadFromJsonAsync<List<PaymentDto>>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.Should().BeEmpty();
    }

    [Fact]
    public async Task CreatePayment_AsAdmin_Returns201()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1 };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { amount = 25.0m, method = "Card" };
        var response = await _client.PostJson($"/api/payments?orderId={order.Id}", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    #endregion
}
