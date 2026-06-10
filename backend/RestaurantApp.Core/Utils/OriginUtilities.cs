namespace RestaurantApp.Core.Utils;

public static class OriginUtilities
{
    /// <summary>
    /// Validates whether a request origin matches any of the allowed origins,
    /// handling localhost ↔ 127.0.0.1 ↔ 0.0.0.0 substitution.
    /// </summary>
    public static bool IsAllowed(string referer, string[] allowedOrigins)
    {
        if (string.IsNullOrEmpty(referer))
            return false;

        if (!Uri.TryCreate(referer, UriKind.Absolute, out Uri? requestUri))
            return false;

        foreach (string origin in allowedOrigins)
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out Uri? originUri))
                continue;

            if (string.Equals(originUri.Scheme, requestUri.Scheme, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(originUri.Host, requestUri.Host, StringComparison.OrdinalIgnoreCase) &&
                (originUri.IsDefaultPort && requestUri.IsDefaultPort || originUri.Port == requestUri.Port))
                return true;
        }

        // Also check host-only matches for origins without port/scheme
        IEnumerable<string> expandedOrigins = allowedOrigins.SelectMany(o => new[]
        {
            o,
            o.Replace("localhost", "127.0.0.1", StringComparison.OrdinalIgnoreCase),
            o.Replace("localhost", "0.0.0.0", StringComparison.OrdinalIgnoreCase)
        }).Distinct(StringComparer.OrdinalIgnoreCase);

        foreach (string? o in expandedOrigins)
        {
            if (!Uri.TryCreate(o, UriKind.Absolute, out Uri? au))
                continue;
            if (string.Equals(au.Host, requestUri.Host, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
