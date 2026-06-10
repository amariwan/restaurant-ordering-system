using System.Net;
using Microsoft.Extensions.Logging;
using RestaurantApp.Core.Exceptions;

namespace RestaurantApp.API.Middleware;

public class ExceptionMiddleware
{
    private static readonly Dictionary<Type, (LogLevel Level, int StatusCode)> HandlerMap = new()
    {
        [typeof(BadRequestException)]    = (LogLevel.Warning, (int)HttpStatusCode.BadRequest),
        [typeof(UnauthorizedAccessException)] = (LogLevel.Warning, (int)HttpStatusCode.Unauthorized),
        [typeof(NotFoundException)]      = (LogLevel.Warning, (int)HttpStatusCode.NotFound),
        [typeof(ConflictException)]      = (LogLevel.Warning, (int)HttpStatusCode.Conflict),
        [typeof(ForbiddenException)]     = (LogLevel.Warning, (int)HttpStatusCode.Forbidden),
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            if (HandlerMap.TryGetValue(ex.GetType(), out var handler))
            {
                _logger.Log(handler.Level, ex, "{Message}", ex.Message);
                context.Response.StatusCode = handler.StatusCode;
                await context.Response.WriteAsJsonAsync(new { message = ex.Message });
            }
            else
            {
                _logger.LogError(ex, "Unhandled exception");
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                await context.Response.WriteAsJsonAsync(new { message = "Internal server error" });
            }
        }
    }
}
