using RestaurantApp.Core.DTOs.Payments;

namespace RestaurantApp.Core.Interfaces;

public interface IPaymentService
{
    Task<PaymentDto> CreateAsync(int orderId, PaymentRequest request);
    Task<IEnumerable<PaymentDto>> GetAllByOrderIdAsync(int orderId);
}
