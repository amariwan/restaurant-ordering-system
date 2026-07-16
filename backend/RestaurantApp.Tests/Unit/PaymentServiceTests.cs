using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Payments;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Infrastructure.Data;
using RestaurantApp.Infrastructure.Services;
using RestaurantApp.Tests.TestHelpers;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class PaymentServiceTests
{
    private static readonly AutoMapper.IMapper _mapper = TestDbContextFactory.CreateMapper();

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"payment_test_{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_CreatesPayment_WhenOrderExists()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var result = await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash });

        result.Should().NotBeNull();
        result.OrderId.Should().Be(order.Id);
        result.Amount.Should().Be(10.00m);
    }

    [Fact]
    public async Task CreateAsync_ThrowsNotFoundException_WhenOrderNotFound()
    {
        using var db = CreateContext();
        var svc = new PaymentService(db, _mapper);

        await AsyncTest.Act(() => svc.CreateAsync(999, new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash }))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenOrderIsServed()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db, OrderStatus.Served);
        var svc = new PaymentService(db, _mapper);

        await AsyncTest.Act(() => svc.CreateAsync(order.Id, new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash }))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenOrderIsCancelled()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db, OrderStatus.Cancelled);
        var svc = new PaymentService(db, _mapper);

        await AsyncTest.Act(() => svc.CreateAsync(order.Id, new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash }))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenFullyPaid()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 12.00m, Method = PaymentMethod.Cash });

        await AsyncTest.Act(() => svc.CreateAsync(order.Id, new PaymentRequest { Amount = 1.00m, Method = PaymentMethod.Cash }))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsConflictException_WhenAmountExceedsRemaining()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        await AsyncTest.Act(() => svc.CreateAsync(order.Id, new PaymentRequest { Amount = 13.00m, Method = PaymentMethod.Cash }))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenAmountIsZero()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        await AsyncTest.Act(() => svc.CreateAsync(order.Id, new PaymentRequest { Amount = 0m, Method = PaymentMethod.Cash }))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenAmountIsNegative()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        await AsyncTest.Act(() => svc.CreateAsync(order.Id, new PaymentRequest { Amount = -5.00m, Method = PaymentMethod.Cash }))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_SupportsPartialPayments()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var result1 = await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Cash });
        var result2 = await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Card });

        result1.Amount.Should().Be(6.00m);
        result2.Amount.Should().Be(6.00m);
        (await db.Payments.Where(p => p.OrderId == order.Id).ToListAsync()).Sum(p => p.Amount).Should().Be(12.00m);
    }

    [Fact]
    public async Task CreateAsync_AllowsOverpaymentWithinTolerance()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        await AsyncTest.Act(() => svc.CreateAsync(order.Id, new PaymentRequest { Amount = 12.01m, Method = PaymentMethod.Cash }))
            .Should().NotThrowAsync();
    }

    [Fact]
    public async Task CreateAsync_SetsPaidAtToCurrentTime()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var before = DateTime.UtcNow;
        var result = await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash });
        var after = DateTime.UtcNow;

        result.PaidAt.Should().BeOnOrAfter(before).And.BeOnOrBefore(after.AddSeconds(5));
    }

    [Fact]
    public async Task GetAllByOrderIdAsync_ReturnsPaymentsOrderedByPaidAtDescending()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Cash });
        await Task.Delay(10);
        await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Card });

        var results = await svc.GetAllByOrderIdAsync(order.Id);

        results.Should().HaveCount(2);
        results.Last().Method.Should().Be(PaymentMethod.Cash);
    }

    [Fact]
    public async Task GetAllByOrderIdAsync_ReturnsEmpty_WhenNoPayments()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var results = await svc.GetAllByOrderIdAsync(order.Id);

        results.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateAsync_SetsPaymentStatusToPaid()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var result = await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 12.00m, Method = PaymentMethod.Cash });

        result.Status.Should().Be(PaymentStatus.Paid);
    }

    [Fact]
    public async Task CreateAsync_SetsOrderPaymentStatusToPaid_WhenFullPayment()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 12.00m, Method = PaymentMethod.Cash });

        var updatedOrder = await db.Orders.FindAsync(order.Id);
        updatedOrder!.PaymentStatus.Should().Be(PaymentStatus.Paid);
    }

    [Fact]
    public async Task CreateAsync_SetsOrderPaymentStatusToPartiallyPaid_WhenPartialPayment()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Cash });

        var updatedOrder = await db.Orders.FindAsync(order.Id);
        updatedOrder!.PaymentStatus.Should().Be(PaymentStatus.PartiallyPaid);
    }

    [Fact]
    public async Task GetAllByOrderIdAsync_ReturnsPaymentWithStatus()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var result = await svc.CreateAsync(order.Id, new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Cash });

        result.Status.Should().Be(PaymentStatus.Paid);
    }

    private static async Task<Order> SetupTestOrder(AppDbContext db, OrderStatus status = OrderStatus.Pending)
    {
        var menuItem = new MenuItem { NameEn = "Pizza", NameKu = "پیتزا", Price = 12.00m, Available = true };
        db.MenuItems.Add(menuItem);
        await db.SaveChangesAsync();

        var order = new Order { TableId = 1, UserId = 1, Status = status };
        order.Items.Add(new OrderItem { MenuItemId = menuItem.Id, Quantity = 1, PriceAtOrder = 12.00m });
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        return order;
    }
}
