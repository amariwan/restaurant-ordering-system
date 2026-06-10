using RestaurantApp.Core.Common;

namespace RestaurantApp.Core.Entities;

public class OrderItem : BaseEntity
{
    public int OrderId { get; set; }
    public int MenuItemId { get; set; }
    public int Quantity { get; set; }
    public decimal PriceAtOrder { get; set; }
    public string? Note { get; set; }

    public Order Order { get; set; } = null!;
    public MenuItem MenuItem { get; set; } = null!;
}
