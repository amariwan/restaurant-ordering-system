using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Tables;

public class TableRequest
{
    public required int Number { get; set; }
    public int Capacity { get; set; } = 4;
    public double PosX { get; set; }
    public double PosY { get; set; }
    public string? Area { get; set; }
    public string? ImageUrl { get; set; }
    public TableStatus Status { get; set; } = TableStatus.Free;

    public string? Shape { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public int? Rotation { get; set; }
    public string? ColorHex { get; set; }
    public string? Description { get; set; }
    public string? Type { get; set; }
    public bool? IsActive { get; set; }
    public int? Floor { get; set; }
}
