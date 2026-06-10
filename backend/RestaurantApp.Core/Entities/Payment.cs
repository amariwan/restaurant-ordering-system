using RestaurantApp.Core.Common;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Entities;

public class Payment : BaseEntity, IAuditableEntity
{
    public int OrderId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Unpaid;
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Order Order { get; set; } = null!;
}
