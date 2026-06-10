using FluentAssertions;
using RestaurantApp.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Infrastructure.Data;
using RestaurantApp.Infrastructure.Services;
using AutoMapper;
using RestaurantApp.Infrastructure.Mappings;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class OrderServiceTests
{
    private class NullOrderNotifier : IOrderNotifier
    {
        public Task NotifyNewOrder(OrderDto order) => Task.CompletedTask;
        public Task NotifyOrderStatusChanged(int orderId, OrderStatus status) => Task.CompletedTask;
    }

    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_SetsPriceAtOrder_And_OccupiesTable()
    {
        using var db = CreateContext("create_order_test");

        var category = new Category { Name = "Drinks" };
        db.Categories.Add(category);

        var menuItem = new MenuItem { Name = "Coffee", Price = 2.50m, Category = category };
        db.MenuItems.Add(menuItem);

        var table = new Table { Number = 1, Status = TableStatus.Free };
        db.Tables.Add(table);

        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var mapper = TestDbContextFactory.CreateMapper();
        var svc = new OrderService(db, notifier, mapper);

        var request = new OrderRequest { TableId = table.Id, Items = new[] { new OrderItemRequest { MenuItemId = menuItem.Id, Quantity = 2 } } };

        var dto = await svc.CreateAsync(request, userId: 1);

        dto.Items.Should().ContainSingle();
        dto.Items.First().Price.Should().Be(menuItem.Price);

        var updatedTable = await db.Tables.FindAsync(table.Id);
        updatedTable!.Status.Should().Be(TableStatus.Occupied);
    }

    [Fact]
    public async Task UpdateStatusAsync_Served_SetsTableFree_When_CalledByAdmin()
    {
        using var db = CreateContext("update_status_test");

        var table = new Table { Number = 2, Status = TableStatus.Free };
        db.Tables.Add(table);

        var order = new Order { Table = table, Status = OrderStatus.Pending };
        db.Orders.Add(order);

        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var mapper = TestDbContextFactory.CreateMapper();
        var svc = new OrderService(db, notifier, mapper);

        var result = await svc.UpdateStatusAsync(order.Id, OrderStatus.Served, Core.Enums.UserRole.Admin);

        result.Status.Should().Be(OrderStatus.Served);

        var updatedTable = await db.Tables.FindAsync(table.Id);
        updatedTable!.Status.Should().Be(TableStatus.Free);
    }

    [Fact]
    public async Task UpdateStatusAsync_ThrowsForbidden_When_Waiter_Sets_NonCancelled()
    {
        using var db = CreateContext("waiter_forbidden_test");

        var table = new Table { Number = 3, Status = TableStatus.Occupied };
        db.Tables.Add(table);

        var order = new Order { Table = table, Status = OrderStatus.Pending };
        db.Orders.Add(order);

        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var mapper = TestDbContextFactory.CreateMapper();
        var svc = new OrderService(db, notifier, mapper);

        await Assert.ThrowsAsync<RestaurantApp.Core.Exceptions.ForbiddenException>(() =>
            svc.UpdateStatusAsync(order.Id, OrderStatus.Preparing, Core.Enums.UserRole.Waiter));
    }
}

    [Fact]
    public async Task CreateAsync_ThrowsConflictException_WhenActiveOrderExists()
    {
        using var db = CreateContext("create_conflict_test");

        var table = new Table { Number = 10, Status = TableStatus.Free };
        db.Tables.Add(table);

        var existingOrder = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(existingOrder);

        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var mapper = TestDbContextFactory.CreateMapper();
        var svc = new OrderService(db, notifier, mapper);

        var request = new OrderRequest { TableId = table.Id, Items = new[] { new OrderItemRequest { MenuItemId = 1, Quantity = 1 } } };

        await Assert.ThrowsAsync<RestaurantApp.Core.Exceptions.ConflictException>(() =>
            svc.CreateAsync(request, userId: 2));
    }

    [Fact]
    public async Task CreateAsync_Succeeds_WhenNoActiveOrderExistsButCancelledOrderDoes()
    {
        using var db = CreateContext("create_after_cancel_test");

        var table = new Table { Number = 11, Status = TableStatus.Occupied };
        db.Tables.Add(table);

        var cancelledOrder = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Cancelled };
        db.Orders.Add(cancelledOrder);

        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var mapper = TestDbContextFactory.CreateMapper();
        var svc = new OrderService(db, notifier, mapper);

        var request = new OrderRequest { TableId = table.Id, Items = new[] { new OrderItemRequest { MenuItemId = 1, Quantity = 1 } } };

        var dto = await svc.CreateAsync(request, userId: 2);
        dto.Status.Should().Be(OrderStatus.Pending);

        var updatedTable = await db.Tables.FindAsync(table.Id);
        updatedTable!.Status.Should().Be(TableStatus.Occupied);
    }

    [Fact]
    public async Task UpdateStatusAsync_Cancel_ReleasesTable_WhenNoOtherActiveOrders()
    {
        using var db = CreateContext("cancel_releases_table_test");

        var table = new Table { Number = 12, Status = TableStatus.Occupied };
        db.Tables.Add(table);

        var order = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);

        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var mapper = TestDbContextFactory.CreateMapper();
        var svc = new OrderService(db, notifier, mapper);

        var result = await svc.UpdateStatusAsync(order.Id, OrderStatus.Cancelled, Core.Enums.UserRole.Admin);

        result.Status.Should().Be(OrderStatus.Cancelled);

        var updatedTable = await db.Tables.FindAsync(table.Id);
        updatedTable!.Status.Should().Be(TableStatus.Free);
    }

    [Fact]
    public async Task UpdateStatusAsync_Cancel_DoesNotReleaseTable_WhenOtherActiveOrderExists()
    {
        using var db = CreateContext("cancel_keep_table_test");

        var table = new Table { Number = 13, Status = TableStatus.Occupied };
        db.Tables.Add(table);

        var order1 = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Preparing };
        db.Orders.Add(order1);

        var order2 = new Order { TableId = table.Id, UserId = 2, Status = OrderStatus.Pending };
        db.Orders.Add(order2);

        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var mapper = TestDbContextFactory.CreateMapper();
        var svc = new OrderService(db, notifier, mapper);

        var result = await svc.UpdateStatusAsync(order1.Id, OrderStatus.Cancelled, Core.Enums.UserRole.Admin);

        result.Status.Should().Be(OrderStatus.Cancelled);

        var updatedTable = await db.Tables.FindAsync(table.Id);
        updatedTable!.Status.Should().Be(TableStatus.Occupied);
    }

    [Fact]
    public async Task GetAllAsync_IncludesPaymentStatus()
    {
        using var db = CreateContext("getall_payment_status_test");

        var category = new Category { Name = "Test" };
        db.Categories.Add(category);

        var menuItem = new MenuItem { Name = "Pizza", Price = 10.00m, Category = category };
        db.MenuItems.Add(menuItem);

        var table = new Table { Number = 20, Status = TableStatus.Occupied };
        db.Tables.Add(table);

        var order = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Pending };
        order.Items.Add(new OrderItem { MenuItemId = menuItem.Id, Quantity = 2, PriceAtOrder = 10.00m });
        db.Orders.Add(order);

        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var mapper = TestDbContextFactory.CreateMapper();
        var svc = new OrderService(db, notifier, mapper);

        var result = await svc.GetAllAsync(page: 1, pageSize: 20);

        result.Items.Should().ContainSingle();
        result.Items.First().PaymentStatus.Should().Be(PaymentStatus.Unpaid);
    }
