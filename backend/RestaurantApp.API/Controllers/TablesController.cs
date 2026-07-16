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
    private readonly IFileStorage _fileStorage;

    public TablesController(ITableService tableService, IFileStorage fileStorage)
    {
        _tableService = tableService;
        _fileStorage = fileStorage;
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
    public async Task<IActionResult> GetAll([FromQuery] int? floor = null)
    {
        var tables = await _tableService.GetAllAsync(floor);
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

    [HttpPost("bulk-delete")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> BulkDelete([FromBody] IEnumerable<int> ids)
    {
        await _tableService.DeleteBulkAsync(ids);
        return NoContent();
    }

    [HttpPut("bulk-update")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> BulkUpdate([FromBody] BulkTableUpdateRequest request)
    {
        var tables = await _tableService.UpdateBulkAsync(request.Ids, request.Data);
        return Ok(tables);
    }

    [HttpPut("bulk-move")]
    [Authorize(Roles = RoleConstants.Admin)]
    public async Task<IActionResult> BulkMove([FromBody] IEnumerable<TablePositionUpdate> positions)
    {
        var updates = positions.Select(p => (p.Id, p.PosX, p.PosY));
        var tables = await _tableService.MoveBulkAsync(updates);
        return Ok(tables);
    }
}
