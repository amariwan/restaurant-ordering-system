using FluentValidation;
using RestaurantApp.Core.DTOs.Reservations;

namespace RestaurantApp.Infrastructure.Validators;

public class CreateReservationRequestValidator : AbstractValidator<CreateReservationRequest>
{
    public CreateReservationRequestValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.CustomerEmail).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.CustomerPhone).MaximumLength(30);
        RuleFor(x => x.GuestCount).InclusiveBetween(1, 50);
        RuleFor(x => x.ReservationTime).GreaterThan(DateTime.UtcNow);
        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public class UpdateReservationRequestValidator : AbstractValidator<UpdateReservationRequest>
{
    public UpdateReservationRequestValidator()
    {
        RuleFor(x => x.CustomerName).MaximumLength(100);
        RuleFor(x => x.CustomerEmail).EmailAddress().When(x => x.CustomerEmail != null).MaximumLength(255);
        RuleFor(x => x.CustomerPhone).MaximumLength(30);
        RuleFor(x => x.GuestCount).InclusiveBetween(1, 50).When(x => x.GuestCount.HasValue);
        RuleFor(x => x.ReservationTime).GreaterThan(DateTime.UtcNow).When(x => x.ReservationTime.HasValue);
        RuleFor(x => x.Note).MaximumLength(500);
    }
}

public class UpdateReservationStatusRequestValidator : AbstractValidator<UpdateReservationStatusRequest>
{
    public UpdateReservationStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}
