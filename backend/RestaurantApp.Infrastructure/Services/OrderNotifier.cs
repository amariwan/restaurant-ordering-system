using Microsoft.AspNetCore.SignalR;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.Infrastructure.Services;

public class OrderNotifier : IOrderNotifier
{
    private readonly IHubContext<Hub> _hub;

    public OrderNotifier(IHubContext<Hub> hub)
    {
        _hub = hub;
    }

    public Task NotifyNewOrder(OrderDto order)
    {
        return Task.WhenAll(
            _hub.Clients.Group("kitchen").SendAsync("NewOrder", order),
            _hub.Clients.Group("waiter").SendAsync("NewOrder", order)
        );
    }

    public Task NotifyOrderStatusChanged(int orderId, OrderStatus status)
    {
        return _hub.Clients.All.SendAsync("OrderStatusChanged", new { orderId, status });
    }
}
