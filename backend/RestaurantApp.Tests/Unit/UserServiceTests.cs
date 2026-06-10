using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Users;
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
public class UserServiceTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"user_test_{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllUsers()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        var result = await svc.GetAllAsync();

        result.Should().HaveCount(2); // admin@test.com and waiter@test.com from seed data
    }

    [Fact]
    public async Task GetAllAsync_ReturnsEmpty_WhenNoUsers()
    {
        using var db = CreateContext();
        var svc = new UserService(db, _mapper);

        var result = await svc.GetAllAsync();

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsCorrectUserDtoProperties()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        var result = await svc.GetAllAsync();

        var admin = result.First(u => u.Email == "admin@test.com");
        admin.Name.Should().Be("Admin");
        admin.Email.Should().Be("admin@test.com");
        admin.Role.Should().Be(UserRole.Admin);
    }

    [Fact]
    public async Task UpdateAsync_UpdatesAllFieldsAndReturnsDto()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        var result = await svc.UpdateAsync(1, "Admin Updated", "admin.updated@test.com", "Kitchen");

        result.Name.Should().Be("Admin Updated");
        result.Email.Should().Be("admin.updated@test.com");
        result.Role.Should().Be(UserRole.Kitchen);
    }

    [Fact]
    public async Task UpdateAsync_ThrowsNotFoundException_WhenIdNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        await AsyncTest.Act(() => svc.UpdateAsync(999, "Name", "email@test.com", "Admin"))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateAsync_ThrowsConflictException_WhenEmailAlreadyInUse()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        // Try to update user 1 email to user 2's email
        await AsyncTest.Act(() => svc.UpdateAsync(1, "Name", "waiter@test.com", "Admin"))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateAsync_AllowsEmailUpdateToOwnEmail()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        // Updating to same email should work
        var result = await svc.UpdateAsync(1, "Admin", "admin@test.com", "Waiter");

        result.Email.Should().Be("admin@test.com");
    }

    [Fact]
    public async Task UpdateAsync_ThrowsConflictException_WhenInvalidRole()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        await AsyncTest.Act(() => svc.UpdateAsync(1, "Name", "newemail@test.com", "InvalidRole"))
            .Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateAsync_CaseInsensitiveRoleParsing()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        // Should parse "kitchen" (lowercase) as Kitchen enum
        var result = await svc.UpdateAsync(1, "Name", "admin@test.com", "kitchen");

        result.Role.Should().Be(UserRole.Kitchen);
    }

    [Fact]
    public async Task DeleteAsync_DeletesUserAndDoesNotThrow()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        // Add a test user to delete
        var testUser = new User
        {
            Name = "Test",
            Email = "test@test.com",
            PasswordHash = "$2a$12$abc123",
            Role = UserRole.Waiter
        };
        db.Users.Add(testUser);
        await db.SaveChangesAsync();

        var userId = testUser.Id;
        await svc.DeleteAsync(userId);

        var count = await db.Users.CountAsync(u => u.Id == userId);
        count.Should().Be(0);
    }

    [Fact]
    public async Task DeleteAsync_ThrowsNotFoundException_WhenIdNotFound()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        await AsyncTest.Act(() => svc.DeleteAsync(999))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateAsync_HandlesRoleUpdateFromAdminToKitchen()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        var result = await svc.UpdateAsync(1, "New Name", "new@test.com", "kitchen");

        result.Role.Should().Be(UserRole.Kitchen);
    }

    [Fact]
    public async Task UpdateAsync_HandlesRoleUpdateFromWaiterToAdmin()
    {
        using var db = CreateContext();
        await TestHelpers.TestDbContextFactory.SeedSampleData(db);
        var svc = new UserService(db, _mapper);

        var result = await svc.UpdateAsync(2, "New Waiter", "waiter@test.com", "ADMIN");

        result.Role.Should().Be(UserRole.Admin);
    }
}
