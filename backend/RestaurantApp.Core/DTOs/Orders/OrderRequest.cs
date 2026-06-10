using System.Collections.Generic;

namespace RestaurantApp.Core.DTOs.Orders;

public class OrderRequest
{
    public required int TableId { get; set; }
    public required IEnumerable<OrderItemRequest> Items { get; set; }
}
