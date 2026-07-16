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

public class PaymentsControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public PaymentsControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    [Fact]
    public async Task CreatePayment_AsWaiter_Returns201()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1 };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { amount = 50.0m, method = "Card" };
        var response = await _client.PostJson($"/api/payments?orderId={order.Id}", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreatePayment_ForPaidOrder_Returns410()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1 };
        var payment = new Payment { OrderId = order.Id, Amount = 100.0m, Method = PaymentMethod.Card };
        db.Payments.Add(payment);
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        // Update order to served (fully paid)
        order.Status = OrderStatus.Served;
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { amount = 10.0m, method = "Cash" };
        var response = await _client.PostJson($"/api/payments?orderId={order.Id}", payload);

        // Should return Gone since order is already fully paid/served
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Gone, HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task GetPayments_OrderByOrderId_ReturnsList()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1 };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync($"/api/payments/{order.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreatePayment_ForNonExistentOrder_Returns404()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { amount = 50.0m, method = "Cash" };
        var response = await _client.PostJson("/api/payments?orderId=99999", payload);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreatePayment_WithoutAuth_Returns401()
    {
        var payload = new { amount = 50.0m, method = "Cash" };
        var response = await _client.PostJson("/api/payments?orderId=1", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}

