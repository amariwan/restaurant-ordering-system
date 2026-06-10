using System.Threading.Tasks;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Interfaces;

public interface IOrderNotifier
{
    Task NotifyNewOrder(OrderDto order);
    Task NotifyOrderStatusChanged(int orderId, OrderStatus status);
}
