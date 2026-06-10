namespace RestaurantApp.Core.DTOs.Orders;

public class OrderItemDto
{
    public int Id { get; set; }
    public int MenuItemId { get; set; }
    public required string MenuItemName { get; set; }
    public required string MenuItemNameKu { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string? Note { get; set; }
}
