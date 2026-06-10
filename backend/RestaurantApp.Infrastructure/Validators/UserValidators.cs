using FluentValidation;
using RestaurantApp.Core.DTOs.Users;

namespace RestaurantApp.Infrastructure.Validators;

public class UserUpdateRequestValidator : AbstractValidator<UserUpdateRequest>
{
    public UserUpdateRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Role).NotEmpty().Must(r => Enum.TryParse<Core.Enums.UserRole>(r, true, out _))
            .WithMessage("Role must be one of: Admin, Waiter, Kitchen");
    }
}
