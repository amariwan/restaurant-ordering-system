using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Tables;
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
public class TableServiceTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"table_test_{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllTablesOrderedByNumber()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        var result = await svc.GetAllAsync();

        result.Should().HaveCount(2);
        var numbers = result.Select(t => t.Number).ToList();
        numbers.Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsEmpty_WhenNoTables()
    {
        using var db = CreateContext();
        var svc = new TableService(db, _mapper);

        var result = await svc.GetAllAsync();

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateAsync_CreatesTableAndReturnsDto()
    {
        using var db = CreateContext();
        var svc = new TableService(db, _mapper);

        var request = new TableRequest { Number = 10, Status = TableStatus.Free };
        var result = await svc.CreateAsync(request);

        result.Should().NotBeNull();
        result.Number.Should().Be(10);
        result.Status.Should().Be(TableStatus.Free);

        var countInDb = await db.Tables.CountAsync();
        countInDb.Should().Be(1);
    }

    [Fact]
    public async Task CreateAsync_ThrowsConflictException_WhenNumberExists()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        // Table 1 already exists in seed data
        var request = new TableRequest { Number = 1, Status = TableStatus.Free };

        await AsyncTest.Act(() => svc.CreateAsync(request))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateAsync_UpdatesTableAndReturnsDto()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        var request = new TableRequest { Number = 5, Status = TableStatus.Reserved };
        var result = await svc.UpdateAsync(1, request);

        result.Number.Should().Be(5);
        result.Status.Should().Be(TableStatus.Reserved);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsNotFoundException_WhenIdNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        var request = new TableRequest { Number = 99, Status = TableStatus.Free };

        await AsyncTest.Act(() => svc.UpdateAsync(999, request))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateAsync_ThrowsConflictException_WhenNewNumberExists()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        // Try to update table 1 to number 2 (which exists)
        var request = new TableRequest { Number = 2, Status = TableStatus.Free };

        await AsyncTest.Act(() => svc.UpdateAsync(1, request))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateAsync_AllowsSameNumber_WhenUpdatingOwnTable()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        // Update table 1 to keep number 1 (should be allowed)
        var request = new TableRequest { Number = 1, Status = TableStatus.Reserved };
        var result = await svc.UpdateAsync(1, request);

        result.Number.Should().Be(1);
    }

    [Fact]
    public async Task DeleteAsync_DeletesTableAndDoesNotThrow()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        // Delete table 2 (occupied) - this should actually throw a conflict
        // Let's delete a free table instead
        var freeTable = new Table { Number = 50, Status = TableStatus.Free };
        db.Tables.Add(freeTable);
        await db.SaveChangesAsync();

        await svc.DeleteAsync(50);

        var count = await db.Tables.CountAsync(t => t.Id == 50);
        count.Should().Be(0);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsNotFoundException_WhenIdNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        await AsyncTest.Act(() => svc.DeleteAsync(999))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_ThrowsConflictException_WhenTableIsOccupied()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        // Table 2 is occupied in seed data
        await AsyncTest.Act(() => svc.DeleteAsync(2))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsCorrectDtoProperties()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new TableService(db, _mapper);

        var result = await svc.GetAllAsync();

        var table1 = result.First(t => t.Number == 1);
        table1.Id.Should().Be(1);
        table1.Number.Should().Be(1);
        table1.Status.Should().Be(TableStatus.Free);
    }
}
