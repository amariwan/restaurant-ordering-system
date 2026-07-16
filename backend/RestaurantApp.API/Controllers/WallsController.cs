using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantApp.Core.Constants;
using RestaurantApp.Core.DTOs.Settings;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/walls")]
[Authorize(Roles = RoleConstants.Admin)]
public class WallsController : ControllerBase
{
    private readonly IWallService _wallService;

    public WallsController(IWallService wallService)
    {
        _wallService = wallService;
    }

    [HttpGet]
    public async Task<IActionResult> GetByFloor([FromQuery] int floor = 1)
    {
        var walls = await _wallService.GetByFloorAsync(floor);
        return Ok(walls);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] WallRequest request)
    {
        var wall = await _wallService.CreateAsync(request);
        return CreatedAtAction(nameof(GetByFloor), new { floor = request.Floor }, wall);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] WallRequest request)
    {
        var wall = await _wallService.UpdateAsync(id, request);
        return Ok(wall);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _wallService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("bulk-delete")]
    public async Task<IActionResult> BulkDelete([FromBody] IEnumerable<int> ids)
    {
        await _wallService.DeleteBulkAsync(ids);
        return NoContent();
    }
}
