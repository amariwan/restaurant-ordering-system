using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReceiptsController : ControllerBase
{
    private readonly IReceiptService _receiptService;

    public ReceiptsController(IReceiptService receiptService)
    {
        _receiptService = receiptService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Generate([FromQuery] int orderId)
    {
        var receipt = await _receiptService.GenerateReceiptAsync(orderId);
        return CreatedAtAction(nameof(GetById), new { id = receipt.Id }, receipt);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var receipt = await _receiptService.GetByIdAsync(id);
        return Ok(receipt);
    }

    [HttpGet("by-order")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByOrderId([FromQuery] int orderId)
    {
        var receipt = await _receiptService.GetByOrderIdAsync(orderId);
        if (receipt == null)
            return NotFound(new { message = $"No receipt found for order {orderId}" });
        return Ok(receipt);
    }
}
