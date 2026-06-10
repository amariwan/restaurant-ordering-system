using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;
using RestaurantApp.Infrastructure.Mappings;

namespace RestaurantApp.Tests.TestHelpers;

public static class TestDbContextFactory
{
    private static int _counter = 0;

    public static AppDbContext Create([System.Diagnostics.CodeAnalysis.StringSyntax("Code")]string? name = null)
    {
        var dbName = name ?? $"test_db_{Interlocked.Increment(ref _counter)}_{Guid.NewGuid():N}";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    public static async Task SeedSampleData(AppDbContext db)
    {
        var startersCat = new RestaurantApp.Core.Entities.Category { NameEn = "Starters", NameKu = "پێشەکی" };
        var mainsCat = new RestaurantApp.Core.Entities.Category { NameEn = "Mains", NameKu = "سەرەکی" };
        var dessertsCat = new RestaurantApp.Core.Entities.Category { NameEn = "Desserts", NameKu = "شیرینی" };

        db.Categories.AddRange(startersCat, mainsCat, dessertsCat);
        await db.SaveChangesAsync();

        db.MenuItems.AddRange(
            new RestaurantApp.Core.Entities.MenuItem { CategoryId = startersCat.Id, NameEn = "Bruschetta", NameKu = "بروسکێتا", Price = 6.50m, Available = true },
            new RestaurantApp.Core.Entities.MenuItem { CategoryId = mainsCat.Id, NameEn = "Pizza", NameKu = "پیتزا", Price = 12.00m, Available = true },
            new RestaurantApp.Core.Entities.MenuItem { CategoryId = dessertsCat.Id, NameEn = "Tiramisu", NameKu = "تیرامیسو", Price = 7.00m, Available = false }
        );
        await db.SaveChangesAsync();

        db.Tables.AddRange(
            new RestaurantApp.Core.Entities.Table { Number = 1, Status = TableStatus.Free },
            new RestaurantApp.Core.Entities.Table { Number = 2, Status = TableStatus.Occupied }
        );
        await db.SaveChangesAsync();

        var adminUser = new RestaurantApp.Core.Entities.User
        {
            Name = "Admin",
            Email = "admin@test.com",
            PasswordHash = "$2a$12$abc123",
            Role = UserRole.Admin
        };
        var waiterUser = new RestaurantApp.Core.Entities.User
        {
            Name = "Waiter",
            Email = "waiter@test.com",
            PasswordHash = "$2a$12$abc123",
            Role = UserRole.Waiter
        };

        db.Users.AddRange(adminUser, waiterUser);
        await db.SaveChangesAsync();
    }

    public static IMapper CreateMapper() => new MapperConfiguration(cfg => cfg.AddProfile<MappingProfiles>()).CreateMapper();

    public static IOrderNotifier CreateNoopNotifier() => new NoopOrderNotifier();

    private class NoopOrderNotifier : IOrderNotifier
    {
        public Task NotifyNewOrder(Core.DTOs.Orders.OrderDto dto) => Task.CompletedTask;
        public Task NotifyOrderStatusChanged(int orderId, Core.Enums.OrderStatus status) => Task.CompletedTask;
    }
}
