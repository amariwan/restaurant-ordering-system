using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace RestaurantApp.Tests.TestHelpers;

/// <summary>
/// WebApplicationFactory with InMemory DB and test hooks for controller integration tests.
/// </summary>
public class TestWebApplicationFactory : WebApplicationFactory<Program>, IAsyncDisposable
{
    private IServiceScope? _scope;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext registration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            // Register InMemory database with a unique name per test
            var dbName = Guid.NewGuid().ToString("N");
            services.AddDbContext<AppDbContext>(opts =>
                opts.UseInMemoryDatabase($"test_{dbName}"));

            // Replace real IOrderNotifier with noop (no SignalR during tests)
            var notifierDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IOrderNotifier));
            if (notifierDescriptor != null) services.Remove(notifierDescriptor);
            services.AddScoped<IOrderNotifier>(sp => new NoopOrderNotifier());

            // Register S3FileStorage mock with LocalFileStorage (to temp dir)
            var storageDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IFileStorage));
            if (storageDescriptor != null) services.Remove(storageDescriptor);
            services.AddScoped<IFileStorage>(_ => new TestLocalFileStorage());

            _scope = services.BuildServiceProvider().CreateScope();
        });
    }

    /// <summary>Creates a database context for seeding test data.</summary>
    public AppDbContext CreateDbContext()
    {
        if (_scope == null) throw new InvalidOperationException("Factory not yet initialized");
        return _scope.ServiceProvider.GetRequiredService<AppDbContext>();
    }

    /// <summary>Generates a valid JWT token for authentication in tests.</summary>
    public string GenerateJwtToken(string email, UserRole role, List<string>? additionalClaims = null)
    {
        var secretKey = "a".Repeat(40); // Min 32 chars as required
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);
        var securityKey = new SymmetricSecurityKey(keyBytes);
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Role, role.ToString()),
            new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        };

        if (additionalClaims != null)
            claims.AddRange(additionalClaims);

        var token = new JwtSecurityToken(
            issuer: "test",
            audience: "test",
            claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>Seeds the in-memory database with sample data.</summary>
    public async Task SeedSampleData()
    {
        await TestDbContextFactory.SeedSampleData(CreateDbContext());
    }

    public async ValueTask DisposeAsync()
    {
        if (_scope != null)
        {
            var db = _scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureDeletedAsync();
            await db.DisposeAsync();
            _scope.Dispose();
        }
    }

    private class NoopOrderNotifier : IOrderNotifier
    {
        public Task NotifyNewOrder(Core.DTOs.Orders.OrderDto dto) => Task.CompletedTask;
        public Task NotifyOrderStatusChanged(int orderId, Core.Enums.OrderStatus status) => Task.CompletedTask;
    }

    private class TestLocalFileStorage : IFileStorage
    {
        private readonly string _tempDir = Path.Combine(Path.GetTempPath(), $"restaurant-test-{Guid.NewGuid():N}");

        public TestLocalFileStorage()
        {
            Directory.CreateDirectory(_tempDir);
        }

        public async Task<string> UploadAsync(byte[] data, string fileName, string contentType)
        {
            var path = Path.Combine(_tempDir, fileName);
            await File.WriteAllBytesAsync(path, data);
            return $"https://storage.test/images/{fileName}";
        }

        public Task<bool> ExistsAsync(string url) => Task.FromResult(true);

        public async ValueTask DisposeAsync()
        {
            if (Directory.Exists(_tempDir))
                await Task.Run(() => Directory.Delete(_tempDir, true));
        }
    }
}

// Helper extension for string repeat (since StringExtensions doesn't exist)
internal static class StringExtensions
{
    public static string Repeat(this string s, int count)
        => new(s[0], count); // Will fail if empty; tests won't pass empty strings
}
