using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.DTOs.Settings;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class RestaurantSettingService : IRestaurantSettingService
{
    private readonly AppDbContext _db;

    public RestaurantSettingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string?> GetValueAsync(string key)
    {
        var setting = await _db.RestaurantSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == key);
        return setting?.Value;
    }

    public async Task SetValueAsync(string key, string value)
    {
        var setting = await _db.RestaurantSettings
            .FirstOrDefaultAsync(s => s.Key == key);

        if (setting is null)
        {
            _db.RestaurantSettings.Add(new RestaurantSetting { Key = key, Value = value });
        }
        else
        {
            setting.Value = value;
        }

        await _db.SaveChangesAsync();
    }

    public async Task DeleteValueAsync(string key)
    {
        var setting = await _db.RestaurantSettings
            .FirstOrDefaultAsync(s => s.Key == key);

        if (setting is not null)
        {
            _db.RestaurantSettings.Remove(setting);
            await _db.SaveChangesAsync();
        }
    }
}
