namespace System;

internal static class StringExtensions
{
    public static string Repeat(this string s, int count)
    {
        if (string.IsNullOrEmpty(s)) throw new ArgumentException("Cannot repeat null or empty string");
        return string.Concat(Enumerable.Repeat(s, count));
    }
}
