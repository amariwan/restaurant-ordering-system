namespace RestaurantApp.Core.DTOs.Orders;

public class OrderItemRequest
{
    public required int MenuItemId { get; set; }
    public int Quantity { get; set; } = 1;
    public string? Note { get; set; }
}
