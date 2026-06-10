namespace RestaurantApp.Core.DTOs.Menu;

public class MenuItemDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public required string CategoryNameEn { get; set; }
    public required string CategoryNameKu { get; set; }
    public required string NameEn { get; set; }
    public required string NameKu { get; set; }
    public decimal Price { get; set; }
    public bool Available { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DescriptionKu { get; set; }
    public string? ImageUrl { get; set; }
}
