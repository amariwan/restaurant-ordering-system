using RestaurantApp.Core.DTOs.Receipts;

namespace RestaurantApp.Core.Interfaces;

public interface IReceiptService
{
    Task<ReceiptDto> GenerateReceiptAsync(int orderId);
    Task<ReceiptDto> GetByIdAsync(int id);
    Task<ReceiptDto?> GetByOrderIdAsync(int orderId);
}
