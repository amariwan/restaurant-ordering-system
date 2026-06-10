using FluentValidation;
using RestaurantApp.Core.DTOs.Tables;

namespace RestaurantApp.Infrastructure.Validators;

public class TableRequestValidator : AbstractValidator<TableRequest>
{
    public TableRequestValidator()
    {
        RuleFor(x => x.Number).GreaterThan(0);
        RuleFor(x => x.Status).IsInEnum();
    }
}
