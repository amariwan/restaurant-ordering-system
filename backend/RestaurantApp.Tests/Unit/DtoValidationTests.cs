using FluentAssertions;
using RestaurantApp.Core.DTOs.Auth;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Exceptions;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class DtoValidationTests
{
    [Fact]
    public void OrderRequest_WithNullItems_CanBeCreated()
    {
        var request = new OrderRequest { TableId = 1, Items = null! };
        request.Items.Should().BeNull();
    }

    [Fact]
    public void OrderRequest_WithEmptyItems_CanBeCreated()
    {
        var request = new OrderRequest { TableId = 1, Items = Array.Empty<OrderItemRequest>() };
        request.Items.Should().BeEmpty();
    }

    [Fact]
    public void OrderRequest_WithValidItems_CanBeCreated()
    {
        var request = new OrderRequest
        {
            TableId = 5,
            Items = new[] { new OrderItemRequest { MenuItemId = 1, Quantity = 2 } }
        };
        request.TableId.Should().Be(5);
        request.Items.Should().HaveCount(1);
    }

    [Fact]
    public void LoginRequest_RequiresEmailAndPassword()
    {
        var request = new LoginRequest { Email = "test@example.com", Password = "secret" };
        request.Email.Should().Be("test@example.com");
        request.Password.Should().Be("secret");
    }

    [Fact]
    public void RegisterRequest_RequiresNameEmailAndPassword()
    {
        var request = new RegisterRequest { Name = "John", Email = "john@test.com", Password = "StrongPass1!" };
        request.Name.Should().Be("John");
        request.Email.Should().Be("john@test.com");
        request.Password.Should().Be("StrongPass1!");
    }

    [Fact]
    public void OrderItemRequest_DefaultsQuantityToOne()
    {
        var request = new OrderItemRequest { MenuItemId = 42 };
        request.Quantity.Should().Be(1);
        request.Note.Should().BeNull();
    }

    [Fact]
    public void OrderItemRequest_WithNote_StoresNote()
    {
        var request = new OrderItemRequest { MenuItemId = 1, Quantity = 3, Note = "No ice" };
        request.Note.Should().Be("No ice");
    }

    [Fact]
    public void OrderStatusRequest_RequiresStatus()
    {
        var request = new OrderStatusRequest { Status = Core.Enums.OrderStatus.Ready };
        request.Status.Should().Be(Core.Enums.OrderStatus.Ready);
    }
}
