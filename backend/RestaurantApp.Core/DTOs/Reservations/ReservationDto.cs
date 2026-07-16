using System.Collections.Generic;

using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.DTOs.Reservations;

public class ReservationDto
{
    public int Id { get; set; }
    public int? TableId { get; set; }
    public int TableNumber { get; set; }
    public int? UserId { get; set; }
    public string? StaffName { get; set; }
    public required string CustomerName { get; set; }
    public required string CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public int GuestCount { get; set; }
    public DateTime ReservationTime { get; set; }
    public ReservationStatus Status { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
