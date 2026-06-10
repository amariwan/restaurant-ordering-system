using RestaurantApp.Core.Common;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Entities;

public class Order : BaseEntity, IAuditableEntity
{
    public int TableId { get; set; }
    public int? UserId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Table Table { get; set; } = null!;
    public User? User { get; set; }
    public ICollection<OrderItem> Items { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
}
