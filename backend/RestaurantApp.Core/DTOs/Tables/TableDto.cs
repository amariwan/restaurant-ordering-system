using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Tables;

public class TableDto
{
    public int Id { get; set; }
    public int Number { get; set; }
    public TableStatus Status { get; set; }
}
