using FluentValidation;
using RestaurantApp.Core.DTOs.Orders;

namespace RestaurantApp.Infrastructure.Validators;

public class OrderRequestValidator : AbstractValidator<OrderRequest>
{
    public OrderRequestValidator()
    {
        RuleFor(x => x.TableId).GreaterThan(0);
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).SetValidator(new OrderItemRequestValidator());
    }
}

public class OrderItemRequestValidator : AbstractValidator<OrderItemRequest>
{
    public OrderItemRequestValidator()
    {
        RuleFor(x => x.MenuItemId).GreaterThan(0);
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public class OrderStatusRequestValidator : AbstractValidator<OrderStatusRequest>
{
    public OrderStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}
