using RestaurantApp.Core.DTOs.Tables;

namespace RestaurantApp.Core.Interfaces;

public interface ITableService
{
    Task<IEnumerable<TableDto>> GetAllAsync();
    Task<TableDto> CreateAsync(TableRequest request);
    Task<TableDto> UpdateAsync(int id, TableRequest request);
    Task DeleteAsync(int id);
}
