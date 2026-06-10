using System;
using System.Collections.Generic;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Orders;

public class OrderDto
{
    public int Id { get; set; }
    public int TableId { get; set; }
    public int TableNumber { get; set; }
    public int? UserId { get; set; }
    public OrderStatus Status { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public required IEnumerable<OrderItemDto> Items { get; set; }
    public DateTime CreatedAt { get; set; }
}
