using FluentValidation;
using RestaurantApp.Core.DTOs.Payments;

namespace RestaurantApp.Infrastructure.Validators;

public class PaymentRequestValidator : AbstractValidator<PaymentRequest>
{
    public PaymentRequestValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0).PrecisionScale(18, 2, false);
        RuleFor(x => x.Method).IsInEnum();
    }
}
