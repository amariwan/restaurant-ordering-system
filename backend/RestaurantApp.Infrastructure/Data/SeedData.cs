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
        var starters = new Category { NameEn = "Starters", NameKu = "پێشەکی" };
        var mains = new Category { NameEn = "Mains", NameKu = "سەرەکی" };
        var desserts = new Category { NameEn = "Desserts", NameKu = "شیرینی" };
        var drinks = new Category { NameEn = "Drinks", NameKu = "ڤێرەکان" };

        db.Categories.AddRange(starters, mains, desserts, drinks);
        await db.SaveChangesAsync();

        // Now categories have IDs — use them for menu items
        db.MenuItems.AddRange(
            new MenuItem { Category = starters, NameEn = "Bruschetta", NameKu = "بروسکێتا", Price = 6.50m, Available = true, ImageUrl = "/Images/mixxed.jpeg" },
            new MenuItem { Category = mains, NameEn = "Margherita Pizza", NameKu = "پیتزای مارجەریتا", Price = 12.00m, Available = true, ImageUrl = "/Images/P ZA.png" },
            new MenuItem { Category = mains, NameEn = "Grilled Salmon", NameKu = "سەلەمۆنی برژاو", Price = 18.50m, Available = true, ImageUrl = "/Images/Chicken-caesar-salad-in-bowl.webp" },
            new MenuItem { Category = desserts, NameEn = "Tiramisu", NameKu = "تیرامیسو", Price = 7.00m, Available = true, ImageUrl = "/Images/waffles.jpg" },
            new MenuItem { Category = drinks, NameEn = "Espresso", NameKu = "ئێسپریسۆ", Price = 2.50m, Available = true, ImageUrl = "/icons/lemon-tea.png" }
        );

        for (int i = 1; i <= 10; i++)
            db.Tables.Add(new Table { Number = i, Status = TableStatus.Free });

        await db.SaveChangesAsync();
    }
}
