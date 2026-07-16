using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;

namespace RestaurantApp.Tests.Integration;

public class OrdersControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public OrdersControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    #region GET /api/orders Tests

    [Fact]
    public async Task GetAllOrders_WithoutAuth_Returns401()
    {
        var response = await _client.GetAsync("/api/orders");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetAllOrders_WithWaiterToken_Returns200AndList()
    {
        // Arrange
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/orders");
        var body = await response.Content.ReadFromJsonAsync<List<OrderDto>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAllOrders_FilterByStatus_ReturnsFiltered()
    {
        // Arrange
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var orderPending = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Pending };
        var orderPreparing = new Order { TableId = 2, UserId = 1, Status = OrderStatus.Preparing };
        db.Orders.AddRange(orderPending, orderPreparing);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/orders?status=Pending");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetAllOrders_FilterByTableId_ReturnsFiltered()
    {
        // Arrange
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/orders?tableId=1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    #endregion

    #region POST /api/orders Tests

    [Fact]
    public async Task CreateOrder_WithValidData_Returns201()
    {
        // Arrange
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            tableId = 1,
            items = new[]
            {
                new { menuItemId = 1, quantity = 2, note = "Extra sauce" }
            }
        };

        // Act
        var response = await _client.PostJson("/api/orders", payload);
        var body = await response.Content.ReadFromJsonAsync<OrderDto>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        body.Should().NotBeNull();
        body!.TableId.Should().Be(1);
    }

    [Fact]
    public async Task CreateOrder_ForTableWithActiveOrder_Returns409()
    {
        // Arrange: seed existing active order on table 2
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var table = db.Tables.First(t => t.Number == 2);
        var activeOrder = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(activeOrder);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            tableId = 2,
            items = new[] { new { menuItemId = 1, quantity = 1 } }
        };

        // Act
        var response = await _client.PostJson("/api/orders", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CreateOrder_WithInvalidMenuItem_Returns404()
    {
        // Arrange
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new
        {
            tableId = 1,
            items = new[] { new { menuItemId = 99999, quantity = 1 } }
        };

        // Act
        var response = await _client.PostJson("/api/orders", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region PUT /api/orders/{id}/status Tests

    [Fact]
    public async Task UpdateStatus_WithKitchenRole_ChangesToPreparing()
    {
        // Arrange
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.PutJson($"/api/orders/{order.Id}/status", new { status = OrderStatus.Preparing });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UpdateStatus_WithWaiterRole_CannotChangeToPreparing()
    {
        // Arrange
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.PutJson($"/api/orders/{order.Id}/status", new { status = OrderStatus.Preparing });

        // Assert - kitchen role required for preparing
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateStatus_ForNonExistentOrder_Returns404()
    {
        await _factory.SeedSampleData();
        var token = _factory.GenerateJwtToken("kitchen@test.com", UserRole.Kitchen);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.PutJson("/api/orders/99999/status", new { status = OrderStatus.Preparing });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region DELETE /api/orders/{id} Tests

    [Fact]
    public async Task DeleteOrder_AsAdmin_DeletesSuccessfully()
    {
        // Arrange
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1 };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.DeleteAsync($"/api/orders/{order.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteOrder_ForNonExistent_Returns404()
    {
        var token = _factory.GenerateJwtToken("admin@test.com", UserRole.Admin);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.DeleteAsync("/api/orders/99999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteOrder_AsWaiter_Returns403()
    {
        // Arrange
        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.DeleteAsync("/api/orders/1");

        // Assert - waiter cannot delete orders anymore
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region POST /api/orders/{id}/items Tests

    [Fact]
    public async Task AddItemToOrder_WithPendingOrder_Returns200()
    {
        // Arrange
        await _factory.SeedSampleData();
        var db = _factory.CreateDbContext();
        var order = new Order { TableId = 1, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var token = _factory.GenerateJwtToken("waiter@test.com", UserRole.Waiter);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var payload = new { menuItemId = 1, quantity = 3 };

        // Act
        var response = await _client.PostJson($"/api/orders/{order.Id}/items", payload);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    #endregion
}

