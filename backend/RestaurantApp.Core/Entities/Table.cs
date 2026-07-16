using RestaurantApp.Core.Common;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Entities;

public class Table : BaseEntity, IAuditableEntity
{
    public int Number { get; set; }
    public int Capacity { get; set; } = 4;
    public double PosX { get; set; }
    public double PosY { get; set; }
    public string? Area { get; set; }
    public string? ImageUrl { get; set; }
    public TableStatus Status { get; set; }

    // --- New enhanced fields ---
    public TableShape Shape { get; set; } = TableShape.Circle;
    public int Width { get; set; } = 72;
    public int Height { get; set; } = 72;
    public int Rotation { get; set; }
    public string? ColorHex { get; set; }
    public string? Description { get; set; }
    public TableType Type { get; set; } = TableType.Regular;
    public bool IsActive { get; set; } = true;
    public int Floor { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Order> Orders { get; set; } = [];
}