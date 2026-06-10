using RestaurantApp.Core.Interfaces;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Utils;

namespace RestaurantApp.API.Middleware;

public class RefreshTokenAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RefreshTokenAuthMiddleware> _logger;

    public RefreshTokenAuthMiddleware(RequestDelegate next, ILogger<RefreshTokenAuthMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IAuthService auth)
    {
        if (context.Request.Headers.ContainsKey("Authorization"))
        {
            _logger.LogDebug("Authorization header already present for request {Path}", context.Request.Path);
            await _next(context);
            return;
        }

        var path = context.Request.Path;
        if (path.StartsWithSegments("/api/auth/login") ||
            path.StartsWithSegments("/api/auth/register") ||
            path.StartsWithSegments("/api/auth/refresh") ||
            path.StartsWithSegments("/api/auth/logout"))
        {
            await _next(context);
            return;
        }

        var refresh = context.Request.Cookies[CookieOptionsHelper.RefreshCookieName];
        if (!string.IsNullOrWhiteSpace(refresh))
        {
            try
            {
                _logger.LogDebug("Refresh cookie present for request {Path}; attempting token rotation", context.Request.Path);
                var result = await auth.RefreshTokenAsync(refresh);
                if (!string.IsNullOrWhiteSpace(result?.Token))
                {
                    context.Request.Headers["Authorization"] = $"Bearer {result.Token}";
                    _logger.LogDebug("Injected Authorization header from rotated refresh token for user {UserId} on {Path}", result.User?.Id, context.Request.Path);

                    if (!string.IsNullOrWhiteSpace(result.RefreshToken))
                    {
                        context.Response.AppendRefreshCookie(result.RefreshToken, context.Request.IsHttps);
                        _logger.LogDebug("Appended rotated refresh cookie to response for request {Path}", context.Request.Path);

                        if (string.IsNullOrWhiteSpace(context.Request.Cookies[CookieOptionsHelper.CsrfCookieName]))
                        {
                            var csrf = CsrfTokenGenerator.Generate();
                            context.Response.AppendCsrfCookie(csrf, context.Request.IsHttps);
                            _logger.LogDebug("Appended CSRF cookie to response for request {Path}", context.Request.Path);
                        }
                    }
                }
            }
            catch (ForbiddenException fex)
            {
                _logger.LogInformation(fex, "Refresh token invalid or expired for request {Path}", context.Request.Path);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during refresh token exchange for request {Path}", context.Request.Path);
                throw;
            }
        }

        await _next(context);
    }
}
