using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace RestaurantApp.Tests.Integration;

public class OrdersControllerSupplementaryTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public OrdersControllerSupplementaryTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    #region GET /api/orders/{id}

    [Fact]
    public async Task GetOrderById_WithValidId_Returns200()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync($"/api/orders/{order.Id}");
        var body = await response.Content.ReadFromJsonAsync<OrderDto>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
        body!.Id.Should().Be(order.Id);
    }

    [Fact]
    public async Task GetOrderById_WithNonExistentId_Returns404()
    {
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/orders/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetOrderById_WithoutAuth_Returns404()
    {
        var response = await _client.GetAsync("/api/orders/1");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region DELETE /api/orders/{orderId}/items/{itemId}

    [Fact]
    public async Task RemoveItemFromOrder_AsWaiter_Returns204()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var menuItem = db.MenuItems.First();
        var orderItem = new OrderItem
        {
            OrderId = order.Id,
            MenuItemId = menuItem.Id,
            Quantity = 2,
            PriceAtOrder = menuItem.Price
        };
        db.OrderItems.Add(orderItem);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync($"/api/orders/{order.Id}/items/{orderItem.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task RemoveItemFromOrder_NonExistentItem_Returns404()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync($"/api/orders/{order.Id}/items/99999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RemoveItemFromOrder_NonExistentOrder_Returns404()
    {
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/orders/99999/items/1");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RemoveItemFromOrder_WithoutAuth_Returns401()
    {
        var response = await _client.DeleteAsync("/api/orders/1/items/1");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Status transition tests

    [Fact]
    public async Task UpdateStatus_FromPreparingToReady_Returns200()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Preparing };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PutJson($"/api/orders/{order.Id}/status", new { status = OrderStatus.Ready });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateStatus_FromReadyToServed_Returns200()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Ready };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PutJson($"/api/orders/{order.Id}/status", new { status = OrderStatus.Served });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateStatus_FromServedToCancelled_Returns200()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Served };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PutJson($"/api/orders/{order.Id}/status", new { status = OrderStatus.Cancelled });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateStatus_AsWaiter_Returns200()
    {
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Preparing };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PutJson($"/api/orders/{order.Id}/status", new { status = OrderStatus.Ready });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region Auth tests

    [Fact]
    public async Task GetAllOrders_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/orders");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateOrder_WithoutAuth_Returns400()
    {
        var response = await _client.PostAsync("/api/orders", new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateStatus_WithoutAuth_Returns401()
    {
        var response = await _client.PutJson("/api/orders/1/status", new { status = OrderStatus.Preparing });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteOrder_WithoutAuth_Returns401()
    {
        var response = await _client.DeleteAsync("/api/orders/1");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AddItemToOrder_WithoutAuth_Returns401()
    {
        var response = await _client.PostAsync("/api/orders/1/items", new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteOrder_AsKitchen_Returns403()
    {
        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.DeleteAsync("/api/orders/1");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion
}
