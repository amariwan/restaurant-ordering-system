using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Tables;

public class TableDto
{
    public int Id { get; set; }
    public int Number { get; set; }
    public int Capacity { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public string? Area { get; set; }
    public string? ImageUrl { get; set; }
    public TableStatus Status { get; set; }

    public string Shape { get; set; } = "Circle";
    public int Width { get; set; } = 72;
    public int Height { get; set; } = 72;
    public int Rotation { get; set; }
    public string? ColorHex { get; set; }
    public string? Description { get; set; }
    public string Type { get; set; } = "Regular";
    public bool IsActive { get; set; } = true;
    public int Floor { get; set; } = 1;
}
