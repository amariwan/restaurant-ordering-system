namespace RestaurantApp.Core.DTOs.Reservations;

public class UpdateReservationRequest
{
    public int? TableId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public int? GuestCount { get; set; }
    public DateTime? ReservationTime { get; set; }
    public string? Note { get; set; }
}
