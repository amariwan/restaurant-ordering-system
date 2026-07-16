using RestaurantApp.Core.DTOs.Settings;

namespace RestaurantApp.Core.Interfaces;

public interface IWallService
{
    Task<IEnumerable<WallDto>> GetByFloorAsync(int floor);
    Task<WallDto> CreateAsync(WallRequest request);
    Task<WallDto> UpdateAsync(int id, WallRequest request);
    Task DeleteAsync(int id);
    Task DeleteBulkAsync(IEnumerable<int> ids);
}
