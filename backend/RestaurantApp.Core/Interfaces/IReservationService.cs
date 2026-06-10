using RestaurantApp.Core.DTOs.Common;
using RestaurantApp.Core.DTOs.Reservations;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Interfaces;

public interface IReservationService
{
    Task<PaginatedResponse<ReservationDto>> GetAllAsync(ReservationStatus? status = null, DateTime? date = null, int page = 1, int pageSize = 20);
    Task<ReservationDto> GetByIdAsync(int id);
    Task<ReservationDto> CreateAsync(CreateReservationRequest request, int? userId = null);
    Task<ReservationDto> UpdateAsync(int id, UpdateReservationRequest request);
    Task<ReservationDto> UpdateStatusAsync(int id, ReservationStatus status);
    Task DeleteAsync(int id);
}
