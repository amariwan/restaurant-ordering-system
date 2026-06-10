using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RestaurantApp.Core.Constants;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Core.DTOs.Payments;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromQuery] int orderId, [FromBody] PaymentRequest request)
    {
        var payment = await _paymentService.CreateAsync(orderId, request);
        return CreatedAtAction(nameof(GetByOrderId), new { orderId = payment.OrderId }, payment);
    }

    [HttpGet("{orderId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByOrderId(int orderId)
    {
        var payments = await _paymentService.GetAllByOrderIdAsync(orderId);
        return Ok(payments);
    }
}
