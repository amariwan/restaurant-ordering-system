using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RestaurantApp.API.Extensions;
using RestaurantApp.Core.Constants;
using RestaurantApp.Core.DTOs.Reservations;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] CreateReservationRequest request)
    {
        int? userId = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            userId = User.GetUserId();
        }

        var reservation = await _reservationService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = reservation.Id }, reservation);
    }

    [HttpGet]
    [Authorize(Roles = RoleConstants.AdminWaiter)]
    public async Task<IActionResult> GetAll(
        [FromQuery] ReservationStatus? status,
        [FromQuery] DateTime? date,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var reservations = await _reservationService.GetAllAsync(status, date, page, pageSize);
        return Ok(reservations);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = RoleConstants.AdminWaiter)]
    public async Task<IActionResult> GetById(int id)
    {
        var reservation = await _reservationService.GetByIdAsync(id);
        return Ok(reservation);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = RoleConstants.AdminWaiter)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateReservationRequest request)
    {
        var reservation = await _reservationService.UpdateAsync(id, request);
        return Ok(reservation);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = RoleConstants.AdminWaiter)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateReservationStatusRequest request)
    {
        var reservation = await _reservationService.UpdateStatusAsync(id, request.Status);
        return Ok(reservation);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await _reservationService.DeleteAsync(id);
        return NoContent();
    }
}
