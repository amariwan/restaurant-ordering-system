using RestaurantApp.Core.DTOs.Common;
using RestaurantApp.Core.DTOs.Orders;

namespace RestaurantApp.Core.Interfaces;

public interface IOrderService
{
    Task<PaginatedResponse<OrderDto>> GetAllAsync(Core.Enums.OrderStatus? status = null, int? tableId = null, int page = 1, int pageSize = 20);
    Task<OrderDto> GetByIdAsync(int id);
    Task<OrderDto> CreateAsync(OrderRequest request, int? userId);
    Task<OrderDto> UpdateStatusAsync(int id, Core.Enums.OrderStatus status, Core.Enums.UserRole userRole);
    Task<OrderItemDto> AddItemAsync(int orderId, OrderItemRequest request);
    Task RemoveItemAsync(int orderId, int itemId);
    Task DeleteAsync(int id);
}
