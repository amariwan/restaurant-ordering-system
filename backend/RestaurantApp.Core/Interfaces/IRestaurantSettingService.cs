using RestaurantApp.Core.DTOs.Settings;

namespace RestaurantApp.Core.Interfaces;

public interface IRestaurantSettingService
{
    Task<string?> GetValueAsync(string key);
    Task SetValueAsync(string key, string value);
    Task DeleteValueAsync(string key);
}
