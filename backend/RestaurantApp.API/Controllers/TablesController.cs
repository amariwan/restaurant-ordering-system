using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RestaurantApp.Core.Constants;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Core.DTOs.Tables;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TablesController : ControllerBase
{
    private readonly ITableService _tableService;

    public TablesController(ITableService tableService)
    {
        _tableService = tableService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var tables = await _tableService.GetAllAsync();
        return Ok(tables);
    }

    [HttpPost]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> Create([FromBody] TableRequest request)
    {
        var table = await _tableService.CreateAsync(request);
        return CreatedAtAction(nameof(GetAll), new { id = table.Id }, table);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] TableRequest request)
    {
        var table = await _tableService.UpdateAsync(id, request);
        return Ok(table);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        await _tableService.DeleteAsync(id);
        return NoContent();
    }
}
