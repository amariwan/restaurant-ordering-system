namespace RestaurantApp.Core.DTOs.Menu;

public class MenuItemRequest
{
    public required int CategoryId { get; set; }
    public required string NameEn { get; set; }
    public required string NameKu { get; set; }
    public required decimal Price { get; set; }
    public bool Available { get; set; } = true;
    public string? DescriptionEn { get; set; }
    public string? DescriptionKu { get; set; }
    public string? ImageUrl { get; set; }
}
