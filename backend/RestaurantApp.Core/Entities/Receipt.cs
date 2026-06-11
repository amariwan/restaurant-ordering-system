using RestaurantApp.Core.Common;

namespace RestaurantApp.Core.Entities;

public class Receipt : BaseEntity, IAuditableEntity
{
    public string ReceiptNumber { get; set; } = string.Empty;
    public int OrderId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TipAmount { get; set; }
    public string PaymentMethods { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Order Order { get; set; } = null!;
}
