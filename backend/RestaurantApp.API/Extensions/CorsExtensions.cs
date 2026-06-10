namespace RestaurantApp.API.Extensions;

public static class CorsExtensions
{
    public static IServiceCollection AddAppCors(this IServiceCollection services, IConfiguration config, IWebHostEnvironment env)
    {
        var origins = config["CORS_ORIGINS"]?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(origin => origin.Replace("0.0.0.0", "localhost", StringComparison.OrdinalIgnoreCase))
            .Select(origin => origin.Replace("127.0.0.1", "localhost", StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .ToArray() ?? ["http://localhost:3000"];

        var allowedOrigins = origins
            .SelectMany(origin => new[]
            {
                origin,
                origin.Replace("localhost", "127.0.0.1", StringComparison.OrdinalIgnoreCase),
                origin.Replace("localhost", "0.0.0.0", StringComparison.OrdinalIgnoreCase)
            })
            .Distinct()
            .ToArray();

        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                if (env.IsDevelopment())
                {
                    policy.SetIsOriginAllowed(_ => true)
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                }
                else
                {
                    policy.WithOrigins(allowedOrigins)
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                }
            });
        });

        return services;
    }
}
