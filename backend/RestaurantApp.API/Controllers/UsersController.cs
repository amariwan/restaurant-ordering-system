using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RestaurantApp.Core.Constants;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Core.DTOs.Users;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = RoleConstants.Admin)]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var users = await _userService.GetAllAsync(search, page, pageSize);
        return Ok(users);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UserUpdateRequest request)
    {
        var user = await _userService.UpdateAsync(id, request.Name, request.Email, request.Role);
        return Ok(user);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _userService.DeleteAsync(id);
        return NoContent();
    }
}
