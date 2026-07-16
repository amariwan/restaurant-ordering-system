namespace RestaurantApp.Core.Entities;

public class Wall
{
    public int Id { get; set; }
    public int Floor { get; set; } = 1;
    public double StartX { get; set; }
    public double StartY { get; set; }
    public double EndX { get; set; }
    public double EndY { get; set; }
    public string? ColorHex { get; set; }
    public int Thickness { get; set; } = 3;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
