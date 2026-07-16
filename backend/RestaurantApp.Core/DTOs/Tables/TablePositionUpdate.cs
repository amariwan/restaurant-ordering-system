namespace RestaurantApp.Core.DTOs.Tables;

public class TablePositionUpdate
{
    public required int Id { get; set; }
    public required double PosX { get; set; }
    public required double PosY { get; set; }
}
