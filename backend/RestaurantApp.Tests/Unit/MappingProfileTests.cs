using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using RestaurantApp.Core.DTOs.Menu;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.DTOs.Payments;
using RestaurantApp.Core.DTOs.Tables;
using RestaurantApp.Core.DTOs.Users;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Infrastructure.Mappings;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class MappingProfileTests
{
    private static readonly IMapper _mapper = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfiles>(), NullLoggerFactory.Instance).CreateMapper();

    [Fact]
    public void Configuration_IsValid()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfiles>(), NullLoggerFactory.Instance);
        config.AssertConfigurationIsValid();
    }

    [Fact]
    public void Category_To_CategoryDto_MapsCorrectly()
    {
        var entity = new Category { Id = 5, NameEn = "Beverages", NameKu = "ڤێرەکان" };

        var dto = _mapper.Map<CategoryDto>(entity);

        dto.Id.Should().Be(5);
        dto.NameEn.Should().Be("Beverages");
        dto.NameKu.Should().Be("ڤێرەکان");
    }

    [Fact]
    public void MenuItem_To_MenuItemDto_MapsCorrectly()
    {
        var category = new Category { Id = 2, NameEn = "Desserts", NameKu = "شیرینی" };
        var entity = new MenuItem
        {
            Id = 10,
            CategoryId = 2,
            NameEn = "Cheesecake",
            NameKu = "چیزکەیک",
            Price = 8.50m,
            Available = false,
            ImageUrl = "/images/cake.jpg",
            Category = category
        };

        var dto = _mapper.Map<MenuItemDto>(entity);

        dto.Id.Should().Be(10);
        dto.CategoryId.Should().Be(2);
        dto.CategoryNameEn.Should().Be("Desserts");
        dto.CategoryNameKu.Should().Be("شیرینی");
        dto.NameEn.Should().Be("Cheesecake");
        dto.NameKu.Should().Be("چیزکەیک");
        dto.Price.Should().Be(8.50m);
        dto.Available.Should().BeFalse();
        dto.ImageUrl.Should().Be("/images/cake.jpg");
    }

    [Fact]
    public void MenuItem_To_MenuItemDto_WithoutCategory_SetsEmptyCategoryName()
    {
        var entity = new MenuItem { Id = 1, CategoryId = 1, NameEn = "Item", NameKu = "بەند", Price = 5m };

        var dto = _mapper.Map<MenuItemDto>(entity);

        dto.CategoryNameEn.Should().BeEmpty();
        dto.CategoryNameKu.Should().BeEmpty();
    }

    [Fact]
    public void Order_To_OrderDto_MapsCorrectly()
    {
        var table = new Table { Id = 3, Number = 7, Status = TableStatus.Occupied };
        var menuItem = new MenuItem { Id = 1, NameEn = "Pizza", NameKu = "پیتزا", Price = 12m };
        var orderItem = new OrderItem
        {
            Id = 42,
            MenuItemId = 1,
            MenuItem = menuItem,
            Quantity = 2,
            PriceAtOrder = 12m,
            Note = "Extra cheese"
        };
        var entity = new Order
        {
            Id = 100,
            TableId = 3,
            Table = table,
            UserId = 1,
            Status = OrderStatus.Pending,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        entity.Items.Add(orderItem);

        var dto = _mapper.Map<OrderDto>(entity);

        dto.Id.Should().Be(100);
        dto.TableId.Should().Be(3);
        dto.TableNumber.Should().Be(7);
        dto.UserId.Should().Be(1);
        dto.Status.Should().Be(OrderStatus.Pending);
        dto.CreatedAt.Should().Be(new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        dto.Items.Should().HaveCount(1);
    }

    [Fact]
    public void OrderItem_To_OrderItemDto_MapsCorrectly()
    {
        var menuItem = new MenuItem { Id = 5, NameEn = "Burger", NameKu = "بەرگەر", Price = 10m };
        var entity = new OrderItem
        {
            Id = 7,
            MenuItemId = 5,
            MenuItem = menuItem,
            Quantity = 3,
            PriceAtOrder = 10m,
            Note = "No onions"
        };

        var dto = _mapper.Map<OrderItemDto>(entity);

        dto.Id.Should().Be(7);
        dto.MenuItemId.Should().Be(5);
        dto.MenuItemName.Should().Be("Burger");
        dto.MenuItemNameKu.Should().Be("بەرگەر");
        dto.Price.Should().Be(10m);
        dto.Quantity.Should().Be(3);
        dto.Note.Should().Be("No onions");
    }

    [Fact]
    public void OrderItem_To_OrderItemDto_WithoutMenuItem_SetsEmptyName()
    {
        var entity = new OrderItem { Id = 1, MenuItemId = 1, Quantity = 1, PriceAtOrder = 5m };

        var dto = _mapper.Map<OrderItemDto>(entity);

        dto.MenuItemName.Should().BeEmpty();
        dto.MenuItemNameKu.Should().BeEmpty();
    }

    [Fact]
    public void Payment_To_PaymentDto_MapsCorrectly()
    {
        var entity = new Payment
        {
            Id = 20,
            OrderId = 100,
            Amount = 45.00m,
            Method = PaymentMethod.Card,
            PaidAt = new DateTime(2025, 6, 1, 12, 0, 0, DateTimeKind.Utc)
        };

        var dto = _mapper.Map<PaymentDto>(entity);

        dto.Id.Should().Be(20);
        dto.OrderId.Should().Be(100);
        dto.Amount.Should().Be(45.00m);
        dto.Method.Should().Be(PaymentMethod.Card);
    }

    [Fact]
    public void Table_To_TableDto_MapsCorrectly()
    {
        var entity = new Table { Id = 8, Number = 4, Status = TableStatus.Reserved };

        var dto = _mapper.Map<TableDto>(entity);

        dto.Id.Should().Be(8);
        dto.Number.Should().Be(4);
        dto.Status.Should().Be(TableStatus.Reserved);
    }

    [Fact]
    public void User_To_UserDto_MapsCorrectly()
    {
        var entity = new User
        {
            Id = 3,
            Name = "John",
            Email = "john@example.com",
            Role = UserRole.Waiter,
            CreatedAt = new DateTime(2025, 1, 15, 10, 0, 0, DateTimeKind.Utc)
        };

        var dto = _mapper.Map<UserDto>(entity);

        dto.Id.Should().Be(3);
        dto.Name.Should().Be("John");
        dto.Email.Should().Be("john@example.com");
        dto.Role.Should().Be(UserRole.Waiter);
    }

    [Fact]
    public void CategoryDto_To_Category_ReverseMapWorks()
    {
        var dto = new CategoryDto { Id = 1, NameEn = "Snacks", NameKu = "تێنیشت" };

        var entity = _mapper.Map<Category>(dto);

        entity.Id.Should().Be(1);
        entity.NameEn.Should().Be("Snacks");
        entity.NameKu.Should().Be("تێنیشت");
    }

    [Fact]
    public void TableDto_To_Table_ReverseMapWorks()
    {
        var dto = new TableDto { Id = 2, Number = 5, Status = TableStatus.Free };

        var entity = _mapper.Map<Table>(dto);

        entity.Id.Should().Be(2);
        entity.Number.Should().Be(5);
        entity.Status.Should().Be(TableStatus.Free);
    }

    [Fact]
    public void PaymentDto_To_Payment_ReverseMapWorks()
    {
        var dto = new PaymentDto { Id = 10, OrderId = 5, Amount = 25m, Method = PaymentMethod.Cash };

        var entity = _mapper.Map<Payment>(dto);

        entity.Id.Should().Be(10);
        entity.OrderId.Should().Be(5);
        entity.Amount.Should().Be(25m);
        entity.Method.Should().Be(PaymentMethod.Cash);
    }
}
