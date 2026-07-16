using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;
using RestaurantApp.Infrastructure.Mappings;
using RestaurantApp.Infrastructure.Services;

namespace RestaurantApp.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration config)
    {
        // DbContext
        services.AddDbContext<AppDbContext>(opt =>
            opt.UseNpgsql(config["DATABASE_URL"])
               .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

        // AutoMapper
        services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfiles>());

         // FluentValidation
        services.AddValidatorsFromAssemblyContaining<MappingProfiles>();
        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IMenuService, MenuService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ITableService, TableService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IReceiptService, ReceiptService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IReservationService, ReservationService>();
        services.AddScoped<IRestaurantSettingService, RestaurantSettingService>();
        services.AddScoped<IWallService, WallService>();

        // SignalR notifier
        services.AddSingleton<IOrderNotifier, OrderNotifier>();

        // File storage: prefer S3 (or S3-compatible like MinIO) when configured, otherwise use local filesystem
        var hasS3Bucket = !string.IsNullOrEmpty(config["AWS_S3_BUCKET"]) || !string.IsNullOrEmpty(config["S3_BUCKET_NAME"]) || !string.IsNullOrEmpty(config["MINIO_BUCKET"]);
        var hasS3Endpoint = !string.IsNullOrEmpty(config["S3_ENDPOINT"]) || !string.IsNullOrEmpty(config["AWS_S3_ENDPOINT"]) || !string.IsNullOrEmpty(config["MINIO_ENDPOINT"]);

        if (hasS3Bucket || hasS3Endpoint)
            services.AddSingleton<IFileStorage, S3FileStorage>();
        else
            services.AddSingleton<IFileStorage, LocalFileStorage>();

        return services;
    }
}
