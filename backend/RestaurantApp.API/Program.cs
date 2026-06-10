using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Rewrite;
using Microsoft.EntityFrameworkCore;
using RestaurantApp.API.Extensions;
using RestaurantApp.API.Hubs;
using RestaurantApp.API.Middleware;
using RestaurantApp.Infrastructure;
using RestaurantApp.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSignalR();
builder.Services.AddJwtAuth(builder.Configuration);
builder.Services.AddAuthorization();
builder.Services.AddAppCors(builder.Configuration, builder.Environment);

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    });

builder.Services.AddAppSwagger();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await SeedData.EnsureSeedDataAsync(db);
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<RefreshTokenAuthMiddleware>();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();
app.MapHub<OrderHub>("/hubs/orders");
app.UseRewriter(new RewriteOptions().AddRedirect("^swagger$", "swagger/index.html"));
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.RoutePrefix = "swagger";
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "RestaurantApp API v1");
});

app.Run();
