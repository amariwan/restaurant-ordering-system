using RestaurantApp.Core.DTOs.Tables;

namespace RestaurantApp.Core.Interfaces;

public interface ITableService
{
    Task<IEnumerable<TableDto>> GetAllAsync(int? floor = null);
    Task<TableDto> CreateAsync(TableRequest request);
    Task<TableDto> UpdateAsync(int id, TableRequest request);
    Task DeleteAsync(int id);
    Task DeleteBulkAsync(IEnumerable<int> ids);
    Task<IEnumerable<TableDto>> UpdateBulkAsync(IEnumerable<int> ids, TableRequest request);
    Task<IEnumerable<TableDto>> MoveBulkAsync(IEnumerable<(int id, double posX, double posY)> positions);
}
