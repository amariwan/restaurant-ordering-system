namespace RestaurantApp.Core.DTOs.Reservations;

public class CreateReservationRequest
{
    public required string CustomerName { get; set; }
    public required string CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public int GuestCount { get; set; } = 2;
    public required DateTime ReservationTime { get; set; }
    public string? Note { get; set; }
}
