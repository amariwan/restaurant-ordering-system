using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace RestaurantApp.Infrastructure.Data;

/// <summary>
/// Design-time factory to create AppDbContext for EF tools (migrations).
/// Reads DATABASE_URL from environment or falls back to a sensible default for local dev.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<AppDbContext>();
        // Try environment variable first
        var conn = Environment.GetEnvironmentVariable("DATABASE_URL")
                   ?? "Host=localhost;Database=restaurant;Username=postgres;Password=secret";
        builder.UseNpgsql(conn)
               .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        return new AppDbContext(builder.Options);
    }
}
