using System;
using System.IO;
using System.Threading.Tasks;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.Infrastructure.Services;

public class LocalFileStorage : IFileStorage
{
    private readonly string _uploadsFolder;

    public LocalFileStorage()
    {
        _uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(_uploadsFolder)) Directory.CreateDirectory(_uploadsFolder);
    }

    public async Task<string> UploadFileAsync(Stream stream, string fileName, string contentType)
    {
        var ext = Path.GetExtension(fileName) ?? string.Empty;
        var key = $"{Guid.NewGuid():N}{ext}";
        var path = Path.Combine(_uploadsFolder, key);

        await using (var fs = File.Create(path))
        {
            await stream.CopyToAsync(fs);
        }

        // Return a relative path so the controller can convert to an absolute URL using the current request
        return $"/uploads/{key}";
    }
}
