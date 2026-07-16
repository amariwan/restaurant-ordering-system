using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.Infrastructure.Data;

public static class SeedData
{
    public static async Task EnsureSeedDataAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync())
            return; // already seeded

        const int BcryptWorkFactor = 12;

        var defaultPassword = Environment.GetEnvironmentVariable("SEED_DEFAULT_PASSWORD");
        if (string.IsNullOrWhiteSpace(defaultPassword))
            throw new InvalidOperationException(
                "SEED_DEFAULT_PASSWORD environment variable is required but not set. " +
                "Set it to a strong password before running for the first time.");

        // Individual overrides with sensible defaults when env var missing
        string adminPwd = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD") ?? defaultPassword;
        string waiterPwd = Environment.GetEnvironmentVariable("SEED_WAITER_PASSWORD") ?? defaultPassword;
        string kitchenPwd = Environment.GetEnvironmentVariable("SEED_KITCHEN_PASSWORD") ?? defaultPassword;

        db.Users.AddRange(
            new User { Name = "Admin", Email = "admin@restaurant.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPwd, BcryptWorkFactor), Role = UserRole.Admin },
            new User { Name = "Admin2", Email = "admin2@restaurant.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPwd, BcryptWorkFactor), Role = UserRole.Admin },
            new User { Name = "Waiter", Email = "waiter@restaurant.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword(waiterPwd, BcryptWorkFactor), Role = UserRole.Waiter },
            new User { Name = "Waiter2", Email = "waiter2@restaurant.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword(waiterPwd, BcryptWorkFactor), Role = UserRole.Waiter },
            new User { Name = "Kitchen", Email = "kitchen@restaurant.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword(kitchenPwd, BcryptWorkFactor), Role = UserRole.Kitchen },
            new User { Name = "Kitchen2", Email = "kitchen2@restaurant.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword(kitchenPwd, BcryptWorkFactor), Role = UserRole.Kitchen }
        );

        // Create categories explicitly (IDs assigned by DB)
        var starters = new Category { NameEn = "Starters", NameKu = "پێشەکی", SortOrder = 1 };
        var mains = new Category { NameEn = "Mains", NameKu = "سەرەکی", SortOrder = 2 };
        var desserts = new Category { NameEn = "Desserts", NameKu = "شیرینی", SortOrder = 3 };
        var drinks = new Category { NameEn = "Drinks", NameKu = "ڤێرەکان", SortOrder = 4 };

        db.Categories.AddRange(starters, mains, desserts, drinks);
        await db.SaveChangesAsync();

        // Now categories have IDs — use them for menu items
        db.MenuItems.AddRange(
            new MenuItem { Category = starters, NameEn = "Bruschetta", NameKu = "بروسکێتا", Price = 6.50m, Available = true, SortOrder = 1 },
            new MenuItem { Category = mains, NameEn = "Margherita Pizza", NameKu = "پیتزای مارجەریتا", Price = 12.00m, Available = true, SortOrder = 1 },
            new MenuItem { Category = mains, NameEn = "Grilled Salmon", NameKu = "سەلەمۆنی برژاو", Price = 18.50m, Available = true, SortOrder = 2 },
            new MenuItem { Category = desserts, NameEn = "Tiramisu", NameKu = "تیرامیسو", Price = 7.00m, Available = true, SortOrder = 1 },
            new MenuItem { Category = drinks, NameEn = "Espresso", NameKu = "ئێسپریسۆ", Price = 2.50m, Available = true, SortOrder = 1 }
        );

        var tableLayout = new (int num, double x, double y, int cap, string area, int w, int h, TableShape shape, TableType type)[]
        {
            (1, 0.10, 0.13, 4, "Main Hall", 72, 72, TableShape.Circle, TableType.Regular),
            (2, 0.35, 0.13, 4, "Main Hall", 72, 72, TableShape.Circle, TableType.Regular),
            (3, 0.60, 0.13, 6, "Main Hall", 88, 88, TableShape.Circle, TableType.Regular),
            (4, 0.10, 0.47, 4, "Main Hall", 72, 72, TableShape.Square, TableType.Regular),
            (5, 0.35, 0.47, 2, "Main Hall", 72, 72, TableShape.Circle, TableType.Bar),
            (6, 0.60, 0.47, 4, "Main Hall", 96, 64, TableShape.Rectangle, TableType.Regular),
            (7, 0.10, 0.83, 4, "Terrace", 72, 72, TableShape.Circle, TableType.Outdoor),
            (8, 0.35, 0.83, 6, "Terrace", 96, 64, TableShape.Rectangle, TableType.Outdoor),
            (9, 0.60, 0.83, 8, "Terrace", 96, 64, TableShape.Rectangle, TableType.VIP),
            (10, 0.85, 0.83, 4, "Terrace", 72, 72, TableShape.Oval, TableType.Outdoor),
        };
        foreach (var (num, x, y, cap, area, w, h, shape, type) in tableLayout)
            db.Tables.Add(new Table { Number = num, PosX = x, PosY = y, Capacity = cap, Area = area, Width = w, Height = h, Shape = shape, Type = type, Status = TableStatus.Free });

        await db.SaveChangesAsync();
    }
}
