using RestaurantApp.Core.DTOs.Common;
using RestaurantApp.Core.DTOs.Menu;

namespace RestaurantApp.Core.Interfaces;

public interface IMenuService
{
    Task<IEnumerable<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto> CreateCategoryAsync(CategoryRequest request);
    Task<CategoryDto> UpdateCategoryAsync(int id, CategoryRequest request);
    Task DeleteCategoryAsync(int id);

    Task<PaginatedResponse<MenuItemDto>> GetMenuItemsAsync(int? categoryId = null, bool? available = null, int page = 1, int pageSize = 20);
    Task<MenuItemDto> GetMenuItemByIdAsync(int id);
    Task<MenuItemDto> CreateMenuItemAsync(MenuItemRequest request);
    Task<MenuItemDto> UpdateMenuItemAsync(int id, MenuItemRequest request);
    Task DeleteMenuItemAsync(int id);
}
