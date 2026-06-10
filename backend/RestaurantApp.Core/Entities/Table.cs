using RestaurantApp.Core.Common;

namespace RestaurantApp.Core.Entities;

public class Table : BaseEntity, IAuditableEntity
{
    public int Number { get; set; }
    public int Capacity { get; set; } = 4;
    public string? Area { get; set; }
    public Core.Enums.TableStatus Status { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Order> Orders { get; set; } = [];
}
