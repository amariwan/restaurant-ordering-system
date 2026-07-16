using Microsoft.AspNetCore.SignalR;
using Moq;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Enums;
using RestaurantApp.Infrastructure.Services;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class OrderNotifierTests
{
    private readonly Mock<IHubContext<Hub>> _hubMock;
    private readonly Mock<IHubClients> _clientsMock;
    private readonly Mock<IClientProxy> _clientProxyMock;
    private readonly OrderNotifier _notifier;

    public OrderNotifierTests()
    {
        _clientProxyMock = new Mock<IClientProxy>();
        _clientsMock = new Mock<IHubClients>();
        _hubMock = new Mock<IHubContext<Hub>>();
        _hubMock.Setup(h => h.Clients).Returns(_clientsMock.Object);
        _notifier = new OrderNotifier(_hubMock.Object);
    }

    [Fact]
    public async Task NotifyNewOrder_SendsToKitchenGroup()
    {
        _clientsMock.Setup(c => c.Group("kitchen")).Returns(_clientProxyMock.Object);
        var dto = new OrderDto { Id = 1, Items = [] };

        await _notifier.NotifyNewOrder(dto);

        _clientsMock.Verify(c => c.Group("kitchen"), Times.Once);
        _clientProxyMock.Verify(
            p => p.SendAsync("NewOrder", dto, default),
            Times.Once);
    }

    [Fact]
    public async Task NotifyOrderStatusChanged_SendsToAll()
    {
        _clientsMock.Setup(c => c.All).Returns(_clientProxyMock.Object);

        await _notifier.NotifyOrderStatusChanged(42, OrderStatus.Ready);

        _clientsMock.Verify(c => c.All, Times.Once);
        _clientProxyMock.Verify(
            p => p.SendAsync("OrderStatusChanged", It.Is<object>(o =>
                o.GetType().GetProperty("orderId")!.GetValue(o)!.Equals(42) &&
                o.GetType().GetProperty("status")!.GetValue(o)!.Equals(OrderStatus.Ready)),
                default),
            Times.Once);
    }

    [Fact]
    public async Task NotifyNewOrder_CallsSendAsyncWithCorrectMethodName()
    {
        _clientsMock.Setup(c => c.Group("kitchen")).Returns(_clientProxyMock.Object);

        await _notifier.NotifyNewOrder(new OrderDto { Items = [] });

        _clientProxyMock.Verify(
            p => p.SendAsync("NewOrder", It.IsAny<OrderDto>(), default),
            Times.Once);
    }

    [Fact]
    public async Task NotifyOrderStatusChanged_CallsSendAsyncWithCorrectMethodName()
    {
        _clientsMock.Setup(c => c.All).Returns(_clientProxyMock.Object);

        await _notifier.NotifyOrderStatusChanged(1, OrderStatus.Preparing);

        _clientProxyMock.Verify(
            p => p.SendAsync("OrderStatusChanged", It.IsAny<object>(), default),
            Times.Once);
    }
}
