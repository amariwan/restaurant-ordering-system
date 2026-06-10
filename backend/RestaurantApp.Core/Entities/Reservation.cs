using RestaurantApp.Core.Common;

namespace RestaurantApp.Core.Entities;

public class Reservation : BaseEntity, IAuditableEntity
{
    public int? TableId { get; set; }
    public int? UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public int GuestCount { get; set; } = 2;
    public DateTime ReservationTime { get; set; }
    public Core.Enums.ReservationStatus Status { get; set; } = Core.Enums.ReservationStatus.Pending;
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Table? Table { get; set; }
    public User? User { get; set; }
}
