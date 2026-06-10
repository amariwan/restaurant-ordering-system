using FluentAssertions;
using Microsoft.Extensions.Configuration;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Services;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class FileStorageServiceTests
{
    [Fact]
    public async Task LocalFileStorage_UploadFileAsync_CreatesFileOnDiskAndReturnsRelativePath()
    {
        var storage = new LocalFileStorage();
        var content = "test-content";
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));

        var result = await storage.UploadFileAsync(stream, "test.txt", "text/plain");

        result.Should().StartWith("/uploads/");
        result.Should().EndWith(".txt");
    }

    [Fact]
    public async Task LocalFileStorage_UploadFileAsync_PreservesStreamContent()
    {
        var storage = new LocalFileStorage();
        var content = "hello-world-data";
        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));

        var result = await storage.UploadFileAsync(stream, "data.bin", "application/octet-stream");

        var fullPath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            result.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        File.Exists(fullPath).Should().BeTrue();
        var written = await File.ReadAllTextAsync(fullPath);
        written.Should().Be(content);
    }

    [Fact]
    public void LocalFileStorage_Constructor_CreatesUploadDirectory()
    {
        var expectedDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

        if (Directory.Exists(expectedDir))
            Directory.Delete(expectedDir, recursive: true);

        _ = new LocalFileStorage();

        Directory.Exists(expectedDir).Should().BeTrue();
    }

    [Fact]
    public void S3FileStorage_Constructor_ThrowsWhenNoBucketConfigured()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string>())
            .Build();

        FluentActions.Invoking(() => new S3FileStorage(config))
            .Should().Throw<ArgumentException>();
    }

    [Fact]
    public void S3FileStorage_Constructor_DoesNotThrowWithValidConfig()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string>
            {
                ["AWS_S3_BUCKET"] = "test-bucket",
                ["AWS_REGION"] = "us-east-1"
            })
            .Build();

        FluentActions.Invoking(() => new S3FileStorage(config))
            .Should().NotThrow();
    }
}
