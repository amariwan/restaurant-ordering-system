using RestaurantApp.Core.DTOs.Common;
using RestaurantApp.Core.DTOs.Users;

namespace RestaurantApp.Core.Interfaces;

public interface IUserService
{
    Task<PaginatedResponse<UserDto>> GetAllAsync(string? search = null, int page = 1, int pageSize = 20);
    Task<UserDto> UpdateAsync(int id, string name, string email, string role);
    Task DeleteAsync(int id);
}
