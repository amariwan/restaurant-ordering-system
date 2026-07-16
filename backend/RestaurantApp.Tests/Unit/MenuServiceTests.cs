using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Menu;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Infrastructure.Data;
using RestaurantApp.Infrastructure.Services;
using AutoMapper;
using RestaurantApp.Infrastructure.Mappings;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class MenuServiceTests
{
    private static readonly IMapper _mapper = TestHelpers.TestDbContextFactory.CreateMapper();
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"menu_test_{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetCategoriesAsync_ReturnsAllCategoriesOrderedByName()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var result = await svc.GetCategoriesAsync();

        result.Should().HaveCount(3);
        var categoryNames = result.Select(c => c.NameEn).ToList();
        categoryNames.Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task GetCategoriesAsync_ReturnsEmpty_WhenNoCategories()
    {
        using var db = CreateContext();
        var svc = new MenuService(db, _mapper);

        var result = await svc.GetCategoriesAsync();

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateCategoryAsync_CreatesAndReturnsCategoryDto()
    {
        using var db = CreateContext();
        var svc = new MenuService(db, _mapper);

        var result = await svc.CreateCategoryAsync(new CategoryRequest { NameEn = "Desserts", NameKu = "شیرینی" });

        result.Should().NotBeNull();
        result.Id.Should().Be(1);
        result.NameEn.Should().Be("Desserts");
        result.NameKu.Should().Be("شیرینی");

        var countInDb = await db.Categories.CountAsync();
        countInDb.Should().Be(1);
    }

    [Fact]
    public async Task CreateCategoryAsync_ThrowsBadRequestException_WhenNameIsWhitespace()
    {
        using var db = CreateContext();
        var svc = new MenuService(db, _mapper);

        var request = new CategoryRequest { NameEn = "   ", NameKu = "   " };
        await AsyncTest.Act(() => svc.CreateCategoryAsync(request))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task CreateCategoryAsync_ThrowsConflictException_WhenDuplicateName()
    {
        using var db = CreateContext();
        var svc = new MenuService(db, _mapper);

        await svc.CreateCategoryAsync(new CategoryRequest { NameEn = "Desserts", NameKu = "شیرینی" });

        await AsyncTest.Act(() => svc.CreateCategoryAsync(new CategoryRequest { NameEn = "Desserts", NameKu = "شیرینی" }))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateCategoryAsync_TrimsName()
    {
        using var db = CreateContext();
        var svc = new MenuService(db, _mapper);

        var result = await svc.CreateCategoryAsync(new CategoryRequest { NameEn = "  Desserts  ", NameKu = "  شیرینی  " });

        result.NameEn.Should().Be("Desserts");
        result.NameKu.Should().Be("شیرینی");
    }

    [Fact]
    public async Task UpdateCategoryAsync_UpdatesAndReturnsUpdatedDto()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var result = await svc.UpdateCategoryAsync(1, new CategoryRequest { NameEn = "Appetizers", NameKu = "پێشەکی" });

        result.NameEn.Should().Be("Appetizers");
        result.NameKu.Should().Be("پێشەکی");
    }

    [Fact]
    public async Task UpdateCategoryAsync_ThrowsNotFoundException_WhenIdNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        await AsyncTest.Act(() => svc.UpdateCategoryAsync(999, new CategoryRequest { NameEn = "New", NameKu = "نوێ" }))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateCategoryAsync_ThrowsBadRequestException_WhenNameIsWhitespace()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var request = new CategoryRequest { NameEn = "  ", NameKu = "  " };
        await AsyncTest.Act(() => svc.UpdateCategoryAsync(1, request))
            .Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task UpdateCategoryAsync_ThrowsConflictException_WhenDuplicateName()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        await AsyncTest.Act(() => svc.UpdateCategoryAsync(1, new CategoryRequest { NameEn = "Mains", NameKu = "سەرەکی" }))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task DeleteCategoryAsync_DeletesCategoryAndDoesNotThrow()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        await svc.DeleteCategoryAsync(3);

        var count = await db.Categories.CountAsync(c => c.Id == 3);
        count.Should().Be(0);
    }

    [Fact]
    public async Task DeleteCategoryAsync_ThrowsNotFoundException_WhenIdNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        await AsyncTest.Act(() => svc.DeleteCategoryAsync(999))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteCategoryAsync_ThrowsConflictException_WhenHasMenuItems()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        // Category 1 (Starters) has Bruschetta in seed data
        await AsyncTest.Act(() => svc.DeleteCategoryAsync(1))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task GetMenuItemsAsync_ReturnsAllItems_WhenNoFilters()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var result = await svc.GetMenuItemsAsync();

        result.Items.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetMenuItemsAsync_FiltersByCategoryId()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var result = await svc.GetMenuItemsAsync(categoryId: 1);

        result.Items.Should().HaveCount(1);
        result.Items.First().CategoryId.Should().Be(1);
    }

    [Fact]
    public async Task GetMenuItemsAsync_FiltersByAvailable()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var available = await svc.GetMenuItemsAsync(available: true);
        available.Items.Should().HaveCount(2);

        var unavailable = await svc.GetMenuItemsAsync(available: false);
        unavailable.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetMenuItemByIdAsync_ReturnsItemWithCategoryName()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var result = await svc.GetMenuItemByIdAsync(1);

        result.Should().NotBeNull();
        result.NameEn.Should().Be("Bruschetta");
        result.CategoryNameEn.Should().Be("Starters");
        result.Price.Should().Be(6.50m);
    }

    [Fact]
    public async Task GetMenuItemByIdAsync_ThrowsNotFoundException_WhenIdNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        await AsyncTest.Act(() => svc.GetMenuItemByIdAsync(999))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CreateMenuItemAsync_CreatesItemWithCategoryId()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var request = new MenuItemRequest
        {
            CategoryId = 1,
            NameEn = "Bruschetta XL",
            NameKu = "بروسکێتای ئێکس ئێڵ",
            Price = 8.50m,
            Available = true
        };

        var result = await svc.CreateMenuItemAsync(request);

        result.Should().NotBeNull();
        result.NameEn.Should().Be("Bruschetta XL");
        result.NameKu.Should().Be("بروسکێتای ئێکس ئێڵ");
        result.CategoryId.Should().Be(1);
        result.Available.Should().BeTrue();
    }

    [Fact]
    public async Task CreateMenuItemAsync_ThrowsNotFoundException_WhenCategoryNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var request = new MenuItemRequest
        {
            CategoryId = 999,
            NameEn = "Test",
            NameKu = "تێست",
            Price = 10.00m
        };

        await AsyncTest.Act(() => svc.UpdateMenuItemAsync(1, request))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateMenuItemAsync_UpdatesAllFields()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var request = new MenuItemRequest
        {
            CategoryId = 2,
            NameEn = "Updated Pizza",
            NameKu = "پیتزای نوێ",
            Price = 14.00m,
            Available = false,
            ImageUrl = "/new-image.png"
        };

        var result = await svc.UpdateMenuItemAsync(1, request);

        result.NameEn.Should().Be("Updated Pizza");
        result.NameKu.Should().Be("پیتزای نوێ");
        result.CategoryId.Should().Be(2);
        result.Price.Should().Be(14.00m);
        result.Available.Should().BeFalse();
        result.ImageUrl.Should().Be("/new-image.png");
    }

    [Fact]
    public async Task UpdateMenuItemAsync_ThrowsNotFoundException_WhenIdNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var request = new MenuItemRequest
        {
            CategoryId = 999,
            NameEn = "Test",
            NameKu = "تێست",
            Price = 10.00m
        };

        await AsyncTest.Act(() => svc.UpdateMenuItemAsync(999, request))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateMenuItemAsync_ThrowsNotFoundException_WhenNewCategoryNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var request = new MenuItemRequest
        {
            CategoryId = 1,
            NameEn = "Test",
            NameKu = "تێست",
            Price = 10.00m
        };

        await AsyncTest.Act(() => svc.UpdateMenuItemAsync(999, request))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteMenuItemAsync_DeletesItemAndDoesNotThrow()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        await svc.DeleteMenuItemAsync(1);

        var count = await db.MenuItems.CountAsync(m => m.Id == 1);
        count.Should().Be(0);
    }

    [Fact]
    public async Task DeleteMenuItemAsync_ThrowsNotFoundException_WhenIdNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        await AsyncTest.Act(() => svc.DeleteMenuItemAsync(999))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteMenuItemAsync_ThrowsConflictException_WhenPartOfOrder()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        // Add a menu item that's already in orders to simulate conflict
        var item = new MenuItem { Id = 99, NameEn = "Old Item", NameKu = "بەندی کۆن", Price = 1.00m };
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();

        var orderItem = new OrderItem { MenuItemId = 99, Quantity = 1, PriceAtOrder = 1.00m };
        db.OrderItems.Add(orderItem);
        await db.SaveChangesAsync();

        await AsyncTest.Act(() => svc.DeleteMenuItemAsync(99))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateMenuItemAsync_SetsAvailableTrueByDefault()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new MenuService(db, _mapper);

        var request = new MenuItemRequest
        {
            CategoryId = 1,
            NameEn = "Test Item",
            NameKu = "بەندی تاقیکردنەوە",
            Price = 5.00m
        };

        var result = await svc.CreateMenuItemAsync(request);
        result.Available.Should().BeTrue();
    }
}
