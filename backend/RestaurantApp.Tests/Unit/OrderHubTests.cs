using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Moq;
using RestaurantApp.API.Hubs;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class OrderHubTests
{
    private readonly Mock<HubCallerContext> _contextMock;
    private readonly Mock<IGroupManager> _groupsMock;
    private readonly OrderHub _hub;

    public OrderHubTests()
    {
        _contextMock = new Mock<HubCallerContext>();
        _groupsMock = new Mock<IGroupManager>();
        _hub = new OrderHub();
        _hub.Context = _contextMock.Object;
        _hub.Groups = _groupsMock.Object;
    }

    [Fact]
    public async Task OnConnectedAsync_KitchenRole_JoinsKitchenGroup()
    {
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Kitchen") });
        _contextMock.Setup(c => c.User).Returns(new ClaimsPrincipal(identity));
        _contextMock.Setup(c => c.ConnectionId).Returns("conn1");

        await _hub.OnConnectedAsync();

        _groupsMock.Verify(g => g.AddToGroupAsync("conn1", "kitchen", default), Times.Once);
    }

    [Fact]
    public async Task OnConnectedAsync_KitchenRole_DoesNotJoinWaiterGroup()
    {
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Kitchen") });
        _contextMock.Setup(c => c.User).Returns(new ClaimsPrincipal(identity));
        _contextMock.Setup(c => c.ConnectionId).Returns("conn1");

        await _hub.OnConnectedAsync();

        _groupsMock.Verify(g => g.AddToGroupAsync("conn1", "waiter", default), Times.Never);
    }

    [Fact]
    public async Task OnConnectedAsync_WaiterRole_JoinsWaiterGroup()
    {
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Waiter") });
        _contextMock.Setup(c => c.User).Returns(new ClaimsPrincipal(identity));
        _contextMock.Setup(c => c.ConnectionId).Returns("conn2");

        await _hub.OnConnectedAsync();

        _groupsMock.Verify(g => g.AddToGroupAsync("conn2", "waiter", default), Times.Once);
    }

    [Fact]
    public async Task OnConnectedAsync_AdminRole_JoinsWaiterGroup()
    {
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Admin") });
        _contextMock.Setup(c => c.User).Returns(new ClaimsPrincipal(identity));
        _contextMock.Setup(c => c.ConnectionId).Returns("conn3");

        await _hub.OnConnectedAsync();

        _groupsMock.Verify(g => g.AddToGroupAsync("conn3", "waiter", default), Times.Once);
    }

    [Fact]
    public async Task OnConnectedAsync_NoRole_JoinsNoGroups()
    {
        _contextMock.Setup(c => c.User).Returns(new ClaimsPrincipal(new ClaimsIdentity()));
        _contextMock.Setup(c => c.ConnectionId).Returns("conn4");

        await _hub.OnConnectedAsync();

        _groupsMock.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Fact]
    public async Task OnDisconnectedAsync_KitchenRole_LeavesKitchenGroup()
    {
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Kitchen") });
        _contextMock.Setup(c => c.User).Returns(new ClaimsPrincipal(identity));
        _contextMock.Setup(c => c.ConnectionId).Returns("conn5");

        await _hub.OnDisconnectedAsync(null);

        _groupsMock.Verify(g => g.RemoveFromGroupAsync("conn5", "kitchen", default), Times.Once);
    }

    [Fact]
    public async Task OnDisconnectedAsync_WaiterRole_LeavesWaiterGroup()
    {
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Waiter") });
        _contextMock.Setup(c => c.User).Returns(new ClaimsPrincipal(identity));
        _contextMock.Setup(c => c.ConnectionId).Returns("conn6");

        await _hub.OnDisconnectedAsync(null);

        _groupsMock.Verify(g => g.RemoveFromGroupAsync("conn6", "waiter", default), Times.Once);
    }

    [Fact]
    public async Task OnDisconnectedAsync_AdminRole_LeavesWaiterGroup()
    {
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Admin") });
        _contextMock.Setup(c => c.User).Returns(new ClaimsPrincipal(identity));
        _contextMock.Setup(c => c.ConnectionId).Returns("conn7");

        await _hub.OnDisconnectedAsync(null);

        _groupsMock.Verify(g => g.RemoveFromGroupAsync("conn7", "waiter", default), Times.Once);
    }

    [Fact]
    public async Task OnDisconnectedAsync_NoRole_LeavesNoGroups()
    {
        _contextMock.Setup(c => c.User).Returns(new ClaimsPrincipal(new ClaimsIdentity()));
        _contextMock.Setup(c => c.ConnectionId).Returns("conn8");

        await _hub.OnDisconnectedAsync(null);

        _groupsMock.Verify(g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }
}
