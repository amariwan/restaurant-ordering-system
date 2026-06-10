namespace RestaurantApp.Core.Utils;

public static class CookieOptionsHelper
{
    public const string RefreshCookieName = "restaurant_refresh";
    public const string CsrfCookieName = "restaurant_csrf";

    private const int DefaultExpiryDays = 30;

    public static CookieOptions CreateRefreshCookie(string value, bool isHttps)
        => new()
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(DefaultExpiryDays)
        };

    public static CookieOptions CreateCsrfCookie(string value, bool isHttps)
        => new()
        {
            HttpOnly = false,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(DefaultExpiryDays)
        };

    public static void AppendRefreshCookie(this HttpResponse response, string value, bool isHttps)
        => response.Cookies.Append(RefreshCookieName, value, CreateRefreshCookie(value, isHttps));

    public static void AppendCsrfCookie(this HttpResponse response, string value, bool isHttps)
        => response.Cookies.Append(CsrfCookieName, value, CreateCsrfCookie(value, isHttps));
}
