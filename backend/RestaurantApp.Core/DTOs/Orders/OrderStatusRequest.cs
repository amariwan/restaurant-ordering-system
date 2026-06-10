using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Orders;

public class OrderStatusRequest
{
    public required OrderStatus Status { get; set; }
}
