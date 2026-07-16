using FluentValidation;
using RestaurantApp.Core.DTOs.Menu;

namespace RestaurantApp.Infrastructure.Validators;

public class ReorderItemRequestValidator : AbstractValidator<ReorderItemRequest>
{
    public ReorderItemRequestValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
