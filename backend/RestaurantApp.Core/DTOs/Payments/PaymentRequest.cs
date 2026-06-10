using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Payments;

public class PaymentRequest
{
    public required decimal Amount { get; set; }
    public required PaymentMethod Method { get; set; }
}
