using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RestaurantApp.API.Extensions;
using RestaurantApp.Core.Constants;
using RestaurantApp.Core.DTOs.Orders;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    [Authorize(Roles = RoleConstants.AdminWaiterKitchen)]
    public async Task<IActionResult> GetAll([FromQuery] OrderStatus? status, [FromQuery] int? tableId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var orders = await _orderService.GetAllAsync(status, tableId, page, pageSize);
        return Ok(orders);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = RoleConstants.AdminWaiterKitchen)]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _orderService.GetByIdAsync(id);
        return Ok(order);
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] OrderRequest request)
    {
        int? userId = User.Identity?.IsAuthenticated == true ? User.GetUserId() : null;
        var order = await _orderService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = RoleConstants.AdminWaiterKitchen)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] OrderStatusRequest request)
    {
        var order = await _orderService.UpdateStatusAsync(id, request.Status, User.GetUserRole());
        return Ok(order);
    }

    /// <summary>
    /// Deprecated: Use PUT /orders/{id}/status with Cancelled instead.
    /// Only administrators may delete orders. Consider deprecating entirely.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await _orderService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/items")]
    [Authorize(Roles = RoleConstants.AdminWaiter)]
    public async Task<IActionResult> AddItem(int id, [FromBody] OrderItemRequest request)
    {
        var item = await _orderService.AddItemAsync(id, request);
        return CreatedAtAction(nameof(GetById), new { id }, item);
    }

    [HttpDelete("{orderId}/items/{itemId}")]
    [Authorize(Roles = RoleConstants.AdminWaiter)]
    public async Task<IActionResult> RemoveItem(int orderId, int itemId)
    {
        await _orderService.RemoveItemAsync(orderId, itemId);
        return NoContent();
    }
}
