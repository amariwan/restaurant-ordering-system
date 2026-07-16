using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using RestaurantApp.Core.Constants;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Core.DTOs.Menu;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuController : ControllerBase
{
    private readonly IMenuService _menuService;
    private readonly IFileStorage _fileStorage;

    public MenuController(IMenuService menuService, IFileStorage fileStorage)
    {
        _menuService = menuService;
        _fileStorage = fileStorage;
    }

    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _menuService.GetCategoriesAsync();
        return Ok(categories);
    }
    [HttpPost("categories")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> CreateCategory([FromBody] CategoryRequest request)
    {
        var category = await _menuService.CreateCategoryAsync(request);
        return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
    }

    [HttpPut("categories/{id}")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryRequest request)
    {
        var category = await _menuService.UpdateCategoryAsync(id, request);
        return Ok(category);
    }

    [HttpDelete("categories/{id}")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        await _menuService.DeleteCategoryAsync(id);
        return NoContent();
    }

    [HttpPatch("categories/reorder")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> ReorderCategories([FromBody] List<ReorderItemRequest> items)
    {
        await _menuService.ReorderCategoriesAsync(items);
        return Ok();
    }

    [HttpPost("upload-image")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest(new { message = "No file provided" });

        await using var stream = file.OpenReadStream();
        var resultPath = await _fileStorage.UploadFileAsync(stream, file.FileName, file.ContentType ?? "application/octet-stream");

        string url;
        if (!string.IsNullOrEmpty(resultPath) && resultPath.StartsWith('/'))
        {
            url = $"{Request.Scheme}://{Request.Host}{resultPath}";
        }
        else
        {
            url = resultPath;
        }

        return Ok(new { url });
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetMenuItems([FromQuery] int? categoryId, [FromQuery] bool? available, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var items = await _menuService.GetMenuItemsAsync(categoryId, available, page, pageSize);
        return Ok(items);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMenuItemById(int id)
    {
        var item = await _menuService.GetMenuItemByIdAsync(id);
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> CreateMenuItem([FromBody] MenuItemRequest request)
    {
        var item = await _menuService.CreateMenuItemAsync(request);
        return CreatedAtAction(nameof(GetMenuItemById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> UpdateMenuItem(int id, [FromBody] MenuItemRequest request)
    {
        var item = await _menuService.UpdateMenuItemAsync(id, request);
        return Ok(item);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> DeleteMenuItem(int id)
    {
        await _menuService.DeleteMenuItemAsync(id);
        return NoContent();
    }

    [HttpPatch("items/reorder")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> ReorderMenuItems([FromBody] List<ReorderItemRequest> items)
    {
        await _menuService.ReorderMenuItemsAsync(items);
        return Ok();
    }
}
