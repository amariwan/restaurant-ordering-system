using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Infrastructure.Data;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class SeedDataTests : IDisposable
{
    public void Dispose()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", null);
    }

    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task EnsureSeedDataAsync_CreatesCategories()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "TestPassword123!");
        using var db = CreateContext("seed_categories");

        await SeedData.EnsureSeedDataAsync(db);

        var categories = await db.Categories.ToListAsync();
        categories.Should().NotBeEmpty();
        categories.Select(c => c.NameEn).Should().Contain(new[] { "Starters", "Mains", "Desserts", "Drinks" });
    }

    [Fact]
    public async Task EnsureSeedDataAsync_CreatesMenuItems()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "TestPassword123!");
        using var db = CreateContext("seed_menuitems");

        await SeedData.EnsureSeedDataAsync(db);

        var items = await db.MenuItems.Include(m => m.Category).ToListAsync();
        items.Should().NotBeEmpty();
        items.Should().Contain(m => m.NameEn == "Bruschetta" && m.Category.NameEn == "Starters");
        items.Should().Contain(m => m.NameEn == "Margherita Pizza" && m.Category.NameEn == "Mains");
        items.Should().Contain(m => m.NameEn == "Tiramisu" && m.Category.NameEn == "Desserts");
        items.Should().Contain(m => m.NameEn == "Espresso" && m.Category.NameEn == "Drinks");
    }

    [Fact]
    public async Task EnsureSeedDataAsync_CreatesAdminUser()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "TestPassword123!");
        using var db = CreateContext("seed_admin");

        await SeedData.EnsureSeedDataAsync(db);

        var admin = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
        admin.Should().NotBeNull();
        admin!.Name.Should().Be("Admin");
        admin.Email.Should().Be("admin@restaurant.com");
    }

    [Fact]
    public async Task EnsureSeedDataAsync_CreatesWaiterUser()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "TestPassword123!");
        using var db = CreateContext("seed_waiter");

        await SeedData.EnsureSeedDataAsync(db);

        var waiter = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Waiter);
        waiter.Should().NotBeNull();
        waiter!.Name.Should().Be("Waiter");
        waiter.Email.Should().Be("waiter@restaurant.com");
    }

    [Fact]
    public async Task EnsureSeedDataAsync_CreatesKitchenUser()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "TestPassword123!");
        using var db = CreateContext("seed_kitchen");

        await SeedData.EnsureSeedDataAsync(db);

        var kitchen = await db.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Kitchen);
        kitchen.Should().NotBeNull();
        kitchen!.Name.Should().Be("Kitchen");
        kitchen.Email.Should().Be("kitchen@restaurant.com");
    }

    [Fact]
    public async Task EnsureSeedDataAsync_CreatesTenTables()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "TestPassword123!");
        using var db = CreateContext("seed_tables");

        await SeedData.EnsureSeedDataAsync(db);

        var tables = await db.Tables.ToListAsync();
        tables.Should().HaveCount(10);
        tables.Should().AllSatisfy(t => t.Status.Should().Be(TableStatus.Free));
    }

    [Fact]
    public async Task EnsureSeedDataAsync_IsIdempotent()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "TestPassword123!");
        using var db = CreateContext("seed_idempotent");

        await SeedData.EnsureSeedDataAsync(db);
        await SeedData.EnsureSeedDataAsync(db);

        var users = await db.Users.CountAsync();
        users.Should().Be(6);

        var categories = await db.Categories.CountAsync();
        categories.Should().Be(4);

        var menuItems = await db.MenuItems.CountAsync();
        menuItems.Should().Be(5);

        var tables = await db.Tables.CountAsync();
        tables.Should().Be(10);
    }

    [Fact]
    public async Task EnsureSeedDataAsync_ThrowsWhenNoPasswordSet()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", null);
        using var db = CreateContext("seed_no_password");

        await AsyncTest.Act(() => SeedData.EnsureSeedDataAsync(db))
            .Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*SEED_DEFAULT_PASSWORD*");
    }

    [Fact]
    public async Task EnsureSeedDataAsync_HashesPasswordsWithBCrypt()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "StrongPass123!");
        using var db = CreateContext("seed_hash");

        await SeedData.EnsureSeedDataAsync(db);

        var user = await db.Users.FirstAsync(u => u.Email == "admin@restaurant.com");
        BCrypt.Net.BCrypt.Verify("StrongPass123!", user.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task EnsureSeedDataAsync_CreatesAllSixUsers()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "TestPassword123!");
        using var db = CreateContext("seed_all_users");

        await SeedData.EnsureSeedDataAsync(db);

        var users = await db.Users.ToListAsync();
        users.Should().HaveCount(6);
        users.Select(u => u.Email).Should().Contain(new[]
        {
            "admin@restaurant.com",
            "admin2@restaurant.com",
            "waiter@restaurant.com",
            "waiter2@restaurant.com",
            "kitchen@restaurant.com",
            "kitchen2@restaurant.com"
        });
    }

    [Fact]
    public async Task EnsureSeedDataAsync_CreatesMenuItemsWithImageUrls()
    {
        Environment.SetEnvironmentVariable("SEED_DEFAULT_PASSWORD", "TestPassword123!");
        using var db = CreateContext("seed_images");

        await SeedData.EnsureSeedDataAsync(db);

        var items = await db.MenuItems.ToListAsync();
        items.Should().AllSatisfy(m => m.ImageUrl.Should().NotBeNullOrEmpty());
    }
}
