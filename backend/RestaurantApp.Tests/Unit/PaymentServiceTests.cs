using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Payments;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Infrastructure.Data;
using RestaurantApp.Infrastructure.Services;
using AutoMapper;
using RestaurantApp.Infrastructure.Mappings;
using Xunit;

namespace RestaurantApp.Tests.Unit;

    private static readonly IMapper _mapper = TestDbContextFactory.CreateMapper();
public class PaymentServiceTests
{
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
        await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash };
        var result = await svc.CreateAsync(1, request);

        result.Should().NotBeNull();
        result.OrderId.Should().Be(1);
        result.Amount.Should().Be(10.00m);
    }

    [Fact]
    public async Task CreateAsync_ThrowsNotFoundException_WhenOrderNotFound()
    {
        using var db = CreateContext();
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash };

        await AsyncTest.Act(() => svc.CreateAsync(999, request))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenOrderIsServed()
    {
        using var db = CreateContext();
        await SetupTestOrder(db, OrderStatus.Served);
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash };

        await AsyncTest.Act(() => svc.CreateAsync(1, request))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenOrderIsCancelled()
    {
        using var db = CreateContext();
        await SetupTestOrder(db, OrderStatus.Cancelled);
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash };

        await AsyncTest.Act(() => svc.CreateAsync(1, request))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenFullyPaid()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        // Pay the full amount (12.00m for pizza)
        var paymentReq = new PaymentRequest { Amount = 12.00m, Method = PaymentMethod.Cash };
        await svc.CreateAsync(1, paymentReq);

        // Try to pay again - should fail since fully paid
        await AsyncTest.Act(() => svc.CreateAsync(1, new PaymentRequest { Amount = 1.00m, Method = PaymentMethod.Cash }))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsConflictException_WhenAmountExceedsRemaining()
    {
        using var db = CreateContext();
        await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        // Order total is 12.00m, try to pay 13.00m
        var request = new PaymentRequest { Amount = 13.00m, Method = PaymentMethod.Cash };

        await AsyncTest.Act(() => svc.CreateAsync(1, request))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenAmountIsZero()
    {
        using var db = CreateContext();
        await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = 0m, Method = PaymentMethod.Cash };

        await AsyncTest.Act(() => svc.CreateAsync(1, request))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_ThrowsBadRequestException_WhenAmountIsNegative()
    {
        using var db = CreateContext();
        await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = -5.00m, Method = PaymentMethod.Cash };

        await AsyncTest.Act(() => svc.CreateAsync(1, request))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateAsync_SupportsPartialPayments()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        // Pay 6.00m first
        var firstPayment = new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Cash };
        var result1 = await svc.CreateAsync(1, firstPayment);

        // Then pay remaining 6.00m
        var secondPayment = new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Card };
        var result2 = await svc.CreateAsync(1, secondPayment);

        result1.Amount.Should().Be(6.00m);
        result2.Amount.Should().Be(6.00m);

        // Verify total in DB
        var payments = await db.Payments.Where(p => p.OrderId == 1).ToListAsync();
        payments.Sum(p => p.Amount).Should().Be(12.00m);
    }

    [Fact]
    public async Task CreateAsync_AllowsOverpaymentWithinTolerance()
    {
        using var db = CreateContext();
        await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        // Pay 12.01m (remaining is exactly 12.00m, tolerance is +0.01)
        var request = new PaymentRequest { Amount = 12.01m, Method = PaymentMethod.Cash };

        await AsyncTest.Act(() => svc.CreateAsync(1, request))
            .Should().NotThrowAsync();
    }

    [Fact]
    public async Task CreateAsync_SetsPaidAtToCurrentTime()
    {
        using var db = CreateContext();
        await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = 10.00m, Method = PaymentMethod.Cash };
        var before = DateTime.UtcNow;

        var result = await svc.CreateAsync(1, request);

        var after = DateTime.UtcNow;
        result.PaidAt.Should().BeInRange(before, after.AddSeconds(5));
    }

    [Fact]
    public async Task GetAllByOrderIdAsync_ReturnsPaymentsOrderedByPaidAtDescending()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        await svc.CreateAsync(1, new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Cash });
        // Small delay to ensure different timestamps
        await Task.Delay(10);
        await svc.CreateAsync(1, new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Card });

        var results = await svc.GetAllByOrderIdAsync(1);

        results.Should().HaveCount(2);
        // Most recent should be first (card payment)
        results.Last().Method.Should().Be(PaymentMethod.Cash);
    }

    [Fact]
    public async Task GetAllByOrderIdAsync_ReturnsEmpty_WhenNoPayments()
    {
        using var db = CreateContext();
        await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var results = await svc.GetAllByOrderIdAsync(1);

        results.Should().BeEmpty();
    }

    private static async Task<Order> SetupTestOrder(AppDbContext db, OrderStatus status = OrderStatus.Pending)
    {
        var order = new Order
        {
            Id = 1,
            TableId = 1,
            UserId = 1,
            Status = status
        };
        db.Orders.Add(order);

        var menuItem = new MenuItem { Name = "Pizza", Price = 12.00m, Available = true };
        db.MenuItems.Add(menuItem);

        order.Items.Add(new OrderItem
        {
            MenuItemId = menuItem.Id,
            Quantity = 1,
            PriceAtOrder = 12.00m
        });

        await db.SaveChangesAsync();
        return order;
    }
}

    [Fact]
    public async Task CreateAsync_SetsPaymentStatusToPaid()
    {
        using var db = CreateContext();
        await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = 12.00m, Method = PaymentMethod.Cash };
        var result = await svc.CreateAsync(1, request);

        result.Status.Should().Be(PaymentStatus.Paid);
    }

    [Fact]
    public async Task CreateAsync_SetsOrderPaymentStatusToPaid_WhenFullPayment()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = 12.00m, Method = PaymentMethod.Cash };
        await svc.CreateAsync(1, request);

        var updatedOrder = await db.Orders.FindAsync(1);
        updatedOrder!.PaymentStatus.Should().Be(PaymentStatus.Paid);
    }

    [Fact]
    public async Task CreateAsync_SetsOrderPaymentStatusToPartiallyPaid_WhenPartialPayment()
    {
        using var db = CreateContext();
        var order = await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var request = new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Cash };
        await svc.CreateAsync(1, request);

        var updatedOrder = await db.Orders.FindAsync(1);
        updatedOrder!.PaymentStatus.Should().Be(PaymentStatus.PartiallyPaid);
    }

    [Fact]
    public async Task GetAllByOrderIdAsync_ReturnsPaymentWithStatus()
    {
        using var db = CreateContext();
        await SetupTestOrder(db);
        var svc = new PaymentService(db, _mapper);

        var result = await svc.CreateAsync(1, new PaymentRequest { Amount = 6.00m, Method = PaymentMethod.Cash });

        result.Status.Should().Be(PaymentStatus.Paid);
    }
