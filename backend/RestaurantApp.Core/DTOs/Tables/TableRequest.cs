using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Tables;

public class TableRequest
{
    public required int Number { get; set; }
    public TableStatus Status { get; set; } = TableStatus.Free;
}
