using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Infrastructure.Data;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class DbContextExtensionsTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task FindOrFailAsync_WhenEntityExists_ReturnsEntity()
    {
        using var db = CreateContext("findorfail_exists");
        var category = new Category { NameEn = "Test", NameKu = "تێست" };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var result = await db.Categories.FindOrFailAsync(category.Id);

        result.Should().NotBeNull();
        result.Id.Should().Be(category.Id);
        result.NameEn.Should().Be("Test");
    }

    [Fact]
    public async Task FindOrFailAsync_WhenEntityNotFound_ThrowsNotFoundException()
    {
        using var db = CreateContext("findorfail_notfound");

        var act = () => db.Categories.FindOrFailAsync(999);

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Category*999*");
    }

    [Fact]
    public async Task FirstOrFailAsync_WhenEntityExists_ReturnsEntity()
    {
        using var db = CreateContext("firstorfail_exists");
        db.Categories.Add(new Category { NameEn = "Target", NameKu = "تارگێت" });
        await db.SaveChangesAsync();

        var result = await db.Categories.FirstOrFailAsync(c => c.NameEn == "Target");

        result.Should().NotBeNull();
        result.NameEn.Should().Be("Target");
    }

    [Fact]
    public async Task FirstOrFailAsync_WhenEntityNotFound_ThrowsNotFoundException()
    {
        using var db = CreateContext("firstorfail_notfound");

        var act = () => db.Categories.FirstOrFailAsync(c => c.NameEn == "NonExistent");

        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*Category*not found*");
    }

    [Fact]
    public async Task TryRemove_RemovesEntityFromDbSet()
    {
        using var db = CreateContext("tryremove");
        var category = new Category { NameEn = "ToRemove", NameKu = "لابردن" };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        db.Categories.TryRemove(category);
        await db.SaveChangesAsync();

        var count = await db.Categories.CountAsync();
        count.Should().Be(0);
    }

    [Fact]
    public async Task TryRemove_ReturnsTrue()
    {
        using var db = CreateContext("tryremove_true");
        var category = new Category { NameEn = "ToRemove", NameKu = "لابردن" };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        var result = db.Categories.TryRemove(category);

        result.Should().BeTrue();
    }
}
