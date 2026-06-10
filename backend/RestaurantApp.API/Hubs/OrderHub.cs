using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RestaurantApp.Core.Constants;

namespace RestaurantApp.API.Hubs;

[Authorize]
public class OrderHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        string? role = Context.User?.FindFirstValue(ClaimTypes.Role);
        if (role == RoleConstants.Kitchen)
            await Groups.AddToGroupAsync(Context.ConnectionId, RoleConstants.KitchenGroup);
        if (role is RoleConstants.Waiter or RoleConstants.Admin)
            await Groups.AddToGroupAsync(Context.ConnectionId, RoleConstants.WaiterGroup);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        string? role = Context.User?.FindFirstValue(ClaimTypes.Role);
        if (role == RoleConstants.Kitchen)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RoleConstants.KitchenGroup);
        if (role is RoleConstants.Waiter or RoleConstants.Admin)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RoleConstants.WaiterGroup);
        await base.OnDisconnectedAsync(exception);
    }
}
