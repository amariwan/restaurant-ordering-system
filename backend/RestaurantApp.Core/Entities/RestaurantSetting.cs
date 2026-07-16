namespace RestaurantApp.Core.Entities;

public class RestaurantSetting
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
