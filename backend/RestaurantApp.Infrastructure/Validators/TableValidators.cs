using FluentValidation;
using RestaurantApp.Core.DTOs.Tables;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.Infrastructure.Validators;

public class TableRequestValidator : AbstractValidator<TableRequest>
{
    public TableRequestValidator()
    {
        RuleFor(x => x.Number).GreaterThan(0);
        RuleFor(x => x.Capacity).GreaterThan(0);
        RuleFor(x => x.PosX).InclusiveBetween(0, 1);
        RuleFor(x => x.PosY).InclusiveBetween(0, 1);
        RuleFor(x => x.Status).IsInEnum();
        When(x => x.Width.HasValue, () => RuleFor(x => x.Width).GreaterThan(0));
        When(x => x.Height.HasValue, () => RuleFor(x => x.Height).GreaterThan(0));
        When(x => x.Rotation.HasValue, () => RuleFor(x => x.Rotation).InclusiveBetween(0, 360));
        When(x => x.Shape != null, () =>
            RuleFor(x => x.Shape).Must(v => Enum.TryParse<TableShape>(v, true, out _))
                .WithMessage("Shape must be Circle, Rectangle, Square, or Oval"));
        When(x => x.Type != null, () =>
            RuleFor(x => x.Type).Must(v => Enum.TryParse<TableType>(v, true, out _))
                .WithMessage("Type must be Regular, VIP, Private, Bar, or Outdoor"));
    }
}
