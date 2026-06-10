using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Reservations;

public class UpdateReservationStatusRequest
{
    public required ReservationStatus Status { get; set; }
}
