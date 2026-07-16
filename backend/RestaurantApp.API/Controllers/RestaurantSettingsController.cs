using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantApp.Core.Constants;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/settings")]
public class RestaurantSettingsController : ControllerBase
{
    private readonly IRestaurantSettingService _settingService;
    private readonly IFileStorage _fileStorage;

    public RestaurantSettingsController(
        IRestaurantSettingService settingService,
        IFileStorage fileStorage)
    {
        _settingService = settingService;
        _fileStorage = fileStorage;
    }

    [HttpGet("map-background")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMapBackground([FromQuery] int floor = 1)
    {
        var key = floor == 1 ? "MapBackgroundUrl" : $"MapBackgroundUrl_{floor}";
        var url = await _settingService.GetValueAsync(key);
        return Ok(new { url });
    }

    [HttpPost("map-background")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> UploadMapBackground(
        [FromForm] IFormFile file,
        [FromQuery] int floor = 1)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided" });

        await using var stream = file.OpenReadStream();
        var resultPath = await _fileStorage.UploadFileAsync(
            stream, file.FileName, file.ContentType ?? "application/octet-stream");

        string url;
        if (!string.IsNullOrEmpty(resultPath) && resultPath.StartsWith('/'))
        {
            url = $"{Request.Scheme}://{Request.Host}{resultPath}";
        }
        else
        {
            url = resultPath;
        }

        var key = floor == 1 ? "MapBackgroundUrl" : $"MapBackgroundUrl_{floor}";
        await _settingService.SetValueAsync(key, url);
        return Ok(new { url });
    }

    [HttpDelete("map-background")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> DeleteMapBackground([FromQuery] int floor = 1)
    {
        var key = floor == 1 ? "MapBackgroundUrl" : $"MapBackgroundUrl_{floor}";
        await _settingService.DeleteValueAsync(key);
        return NoContent();
    }
}
