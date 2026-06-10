using System.Security.Cryptography;

namespace RestaurantApp.Core.Utils;

public static class CsrfTokenGenerator
{
    public const int DefaultLength = 32;

    public static string Generate(int length = DefaultLength)
    {
        var buf = new byte[length];
        RandomNumberGenerator.Fill(buf);
        return Convert.ToBase64String(buf).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }
}
