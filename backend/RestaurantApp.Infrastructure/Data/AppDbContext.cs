using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Common;
using RestaurantApp.Core.Entities;
using RestaurantSetting = RestaurantApp.Core.Entities.RestaurantSetting;

namespace RestaurantApp.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RestaurantApp.Core.Entities.RefreshToken> RefreshTokens => Set<RestaurantApp.Core.Entities.RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Table> Tables => Set<Table>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Receipt> Receipts => Set<Receipt>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<RestaurantSetting> RestaurantSettings => Set<RestaurantSetting>();
    public DbSet<Wall> Walls => Set<Wall>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

                modelBuilder.Entity<RestaurantApp.Core.Entities.RefreshToken>(rb =>
        {
            rb.HasKey(r => r.Id);
            rb.HasIndex(r => r.TokenHash).IsUnique();
            rb.Property(r => r.TokenHash).IsRequired();

            rb.HasOne(r => r.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Table>()
            .HasIndex(t => t.Number)
            .IsUnique();

        modelBuilder.Entity<OrderItem>()
            .Property(oi => oi.PriceAtOrder)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Receipt>(rb =>
        {
            rb.Property(r => r.ReceiptNumber).IsRequired().HasMaxLength(32);
            rb.Property(r => r.TotalAmount).HasPrecision(18, 2);
            rb.Property(r => r.PaidAmount).HasPrecision(18, 2);
            rb.Property(r => r.TaxAmount).HasPrecision(18, 2);
            rb.Property(r => r.TipAmount).HasPrecision(18, 2);
            rb.Property(r => r.PaymentMethods).HasMaxLength(100);

            rb.HasOne(r => r.Order)
                .WithMany()
                .HasForeignKey(r => r.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MenuItem>()
            .Property(m => m.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.Table)
            .WithMany(t => t.Orders)
            .HasForeignKey(o => o.TableId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Order>()
            .HasOne(o => o.User)
            .WithMany()
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.MenuItem)
            .WithMany(m => m.OrderItems)
            .HasForeignKey(oi => oi.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Order)
            .WithMany(o => o.Payments)
            .HasForeignKey(p => p.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.Table)
            .WithMany()
            .HasForeignKey(r => r.TableId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Reservation>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RestaurantSetting>()
            .HasIndex(s => s.Key)
            .IsUnique();

        modelBuilder.Entity<Wall>(w =>
        {
            w.HasKey(e => e.Id);
            w.Property(e => e.StartX).IsRequired();
            w.Property(e => e.StartY).IsRequired();
            w.Property(e => e.EndX).IsRequired();
            w.Property(e => e.EndY).IsRequired();
            w.HasIndex(e => e.Floor);
        });
    }
}
