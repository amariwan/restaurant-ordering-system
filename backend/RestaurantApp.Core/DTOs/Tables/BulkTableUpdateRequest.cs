namespace RestaurantApp.Core.DTOs.Tables;

public class BulkTableUpdateRequest
{
    public required IEnumerable<int> Ids { get; set; }
    public required TableRequest Data { get; set; }
}
