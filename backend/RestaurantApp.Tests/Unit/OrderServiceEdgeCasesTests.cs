using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;
using RestaurantApp.Infrastructure.Services;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class OrderServiceEdgeCasesTests
{
    private static readonly IMapper _mapper = TestDbContextFactory.CreateMapper();

    private sealed class NullOrderNotifier : IOrderNotifier
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
    public async Task CreateAsync_WithInvalidTableId_ThrowsNotFoundException()
    {
        using var db = CreateContext("create_invalid_table");

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        var request = new OrderRequest
        {
            TableId = 99999,
            Items = new[] { new OrderItemRequest { MenuItemId = 1, Quantity = 1 } }
        };

        await AsyncTest.Act(() => svc.CreateAsync(request, userId: 1))
            .Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Table*99999*");
    }

    [Fact]
    public async Task CreateAsync_WithNullItems_ThrowsBadRequestException()
    {
        using var db = CreateContext("create_null_items");

        var table = new Table { Number = 1, Status = TableStatus.Free };
        db.Tables.Add(table);
        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        var request = new OrderRequest { TableId = table.Id, Items = null! };

        await AsyncTest.Act(() => svc.CreateAsync(request, userId: 1))
            .Should().ThrowAsync<BadRequestException>()
            .WithMessage("*At least one item*");
    }

    [Fact]
    public async Task CreateAsync_WithEmptyItems_ThrowsBadRequestException()
    {
        using var db = CreateContext("create_empty_items");

        var table = new Table { Number = 2, Status = TableStatus.Free };
        db.Tables.Add(table);
        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        var request = new OrderRequest { TableId = table.Id, Items = Array.Empty<OrderItemRequest>() };

        await AsyncTest.Act(() => svc.CreateAsync(request, userId: 1))
            .Should().ThrowAsync<BadRequestException>()
            .WithMessage("*At least one item*");
    }

    [Fact]
    public async Task UpdateStatusAsync_WithInvalidOrderId_ThrowsNotFoundException()
    {
        using var db = CreateContext("update_invalid_id");

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        await AsyncTest.Act(() => svc.UpdateStatusAsync(99999, OrderStatus.Preparing, UserRole.Admin))
            .Should().ThrowAsync<NotFoundException>()
            .WithMessage("*Order*99999*");
    }

    [Fact]
    public async Task GetByIdAsync_WithNonexistentOrder_ThrowsNotFoundException()
    {
        using var db = CreateContext("get_nonexistent");

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        await AsyncTest.Act(() => svc.GetByIdAsync(99999))
            .Should().ThrowAsync<NotFoundException>()
            .WithMessage("*99999*");
    }

    [Fact]
    public async Task DeleteAsync_RemovesPendingOrderFromDatabase()
    {
        using var db = CreateContext("delete_removes_order");

        var category = new Category { Name = "Test" };
        db.Categories.Add(category);

        var menuItem = new MenuItem { Name = "Item", Price = 5m, Category = category };
        db.MenuItems.Add(menuItem);

        var table = new Table { Number = 10, Status = TableStatus.Occupied };
        db.Tables.Add(table);
        await db.SaveChangesAsync();

        var order = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Pending };
        order.Items.Add(new OrderItem { MenuItemId = menuItem.Id, Quantity = 1, PriceAtOrder = 5m });
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        await svc.DeleteAsync(order.Id);

        var deletedOrder = await db.Orders.FindAsync(order.Id);
        deletedOrder.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_WithNonexistentOrder_ThrowsNotFoundException()
    {
        using var db = CreateContext("delete_nonexistent");

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        await AsyncTest.Act(() => svc.DeleteAsync(99999))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_WithNonPendingOrder_ThrowsForbiddenException()
    {
        using var db = CreateContext("delete_non_pending");

        var table = new Table { Number = 5, Status = TableStatus.Free };
        db.Tables.Add(table);
        var order = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Preparing };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        await AsyncTest.Act(() => svc.DeleteAsync(order.Id))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task AddItem_ToServedOrder_ThrowsForbiddenException()
    {
        using var db = CreateContext("additem_served");

        var table = new Table { Number = 6, Status = TableStatus.Free };
        db.Tables.Add(table);
        var order = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Served };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        var request = new OrderItemRequest { MenuItemId = 1, Quantity = 1 };

        await AsyncTest.Act(() => svc.AddItemAsync(order.Id, request))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task AddItem_ToCancelledOrder_ThrowsForbiddenException()
    {
        using var db = CreateContext("additem_cancelled");

        var table = new Table { Number = 7, Status = TableStatus.Free };
        db.Tables.Add(table);
        var order = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Cancelled };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        var request = new OrderItemRequest { MenuItemId = 1, Quantity = 1 };

        await AsyncTest.Act(() => svc.AddItemAsync(order.Id, request))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task AddItem_WithInvalidMenuItem_ThrowsNotFoundException()
    {
        using var db = CreateContext("additem_invalid_menu");

        var table = new Table { Number = 8, Status = TableStatus.Free };
        db.Tables.Add(table);
        var order = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        var request = new OrderItemRequest { MenuItemId = 99999, Quantity = 1 };

        await AsyncTest.Act(() => svc.AddItemAsync(order.Id, request))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task AddItem_WithZeroQuantity_ThrowsBadRequestException()
    {
        using var db = CreateContext("additem_zero_qty");

        var table = new Table { Number = 9, Status = TableStatus.Free };
        db.Tables.Add(table);
        var order = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        var request = new OrderItemRequest { MenuItemId = 1, Quantity = 0 };

        await AsyncTest.Act(() => svc.AddItemAsync(order.Id, request))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task RemoveItem_FromNonexistentOrder_ThrowsNotFoundException()
    {
        using var db = CreateContext("remove_nonexistent_order");

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        await AsyncTest.Act(() => svc.RemoveItemAsync(99999, 1))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task RemoveItem_WithNonexistentItemId_ThrowsNotFoundException()
    {
        using var db = CreateContext("remove_nonexistent_item");

        var table = new Table { Number = 11, Status = TableStatus.Free };
        db.Tables.Add(table);
        var order = new Order { TableId = table.Id, UserId = 1, Status = OrderStatus.Pending };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var notifier = new NullOrderNotifier();
        var svc = new OrderService(db, notifier, _mapper);

        await AsyncTest.Act(() => svc.RemoveItemAsync(order.Id, 99999))
            .Should().ThrowAsync<NotFoundException>();
    }
}
