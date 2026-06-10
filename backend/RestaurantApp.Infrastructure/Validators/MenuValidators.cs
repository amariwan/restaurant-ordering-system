using FluentValidation;
using RestaurantApp.Core.DTOs.Menu;

namespace RestaurantApp.Infrastructure.Validators;

public class MenuItemRequestValidator : AbstractValidator<MenuItemRequest>
{
    public MenuItemRequestValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.NameEn).NotEmpty().MaximumLength(200);
        RuleFor(x => x.NameKu).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThan(0).PrecisionScale(18, 2, false);
        RuleFor(x => x.DescriptionEn).MaximumLength(1000);
        RuleFor(x => x.DescriptionKu).MaximumLength(1000);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
    }
}
