using System.IO;
using System.Threading.Tasks;

namespace RestaurantApp.Core.Interfaces;

public interface IFileStorage
{
    /// <summary>
    /// Uploads a file stream and returns a public URL or a relative path (starting with '/') that the caller can use to access the file.
    /// For S3 implementations this should return the full https://... URL. For local implementations it may return a relative path like '/uploads/xyz'.
    /// </summary>
    Task<string> UploadFileAsync(Stream stream, string fileName, string contentType);
}
