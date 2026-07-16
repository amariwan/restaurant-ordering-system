namespace RestaurantApp.Core.DTOs.Menu;

public class CategoryDto
{
    public int Id { get; set; }
    public required string NameEn { get; set; }
    public required string NameKu { get; set; }
    public int SortOrder { get; set; }
}
