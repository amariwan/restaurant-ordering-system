using FluentAssertions;
using Microsoft.AspNetCore.Http;
using RestaurantApp.Core.Utils;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class CookieOptionsHelperTests
{
    [Fact]
    public void CreateRefreshCookie_SetsHttpOnlyTrue()
    {
        var options = CookieOptionsHelper.CreateRefreshCookie("token", true);

        options.HttpOnly.Should().BeTrue();
    }

    [Fact]
    public void CreateRefreshCookie_SetsSecureBasedOnIsHttps()
    {
        var httpsOptions = CookieOptionsHelper.CreateRefreshCookie("token", true);
        var httpOptions = CookieOptionsHelper.CreateRefreshCookie("token", false);

        httpsOptions.Secure.Should().BeTrue();
        httpOptions.Secure.Should().BeFalse();
    }

    [Fact]
    public void CreateRefreshCookie_SetsSameSiteToLax()
    {
        var options = CookieOptionsHelper.CreateRefreshCookie("token", true);

        options.SameSite.Should().Be(SameSiteMode.Lax);
    }

    [Fact]
    public void CreateRefreshCookie_SetsPathToRoot()
    {
        var options = CookieOptionsHelper.CreateRefreshCookie("token", true);

        options.Path.Should().Be("/");
    }

    [Fact]
    public void CreateRefreshCookie_SetsExpiresInFuture()
    {
        var options = CookieOptionsHelper.CreateRefreshCookie("token", true);

        options.Expires.Should().BeCloseTo(DateTimeOffset.UtcNow.AddDays(30), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void CreateCsrfCookie_SetsHttpOnlyFalse()
    {
        var options = CookieOptionsHelper.CreateCsrfCookie("token", true);

        options.HttpOnly.Should().BeFalse();
    }

    [Fact]
    public void CreateCsrfCookie_SetsSecureBasedOnIsHttps()
    {
        var httpsOptions = CookieOptionsHelper.CreateCsrfCookie("token", true);
        var httpOptions = CookieOptionsHelper.CreateCsrfCookie("token", false);

        httpsOptions.Secure.Should().BeTrue();
        httpOptions.Secure.Should().BeFalse();
    }

    [Fact]
    public void CreateCsrfCookie_SetsSameSiteToLax()
    {
        var options = CookieOptionsHelper.CreateCsrfCookie("token", true);

        options.SameSite.Should().Be(SameSiteMode.Lax);
    }

    [Fact]
    public void CreateCsrfCookie_SetsPathToRoot()
    {
        var options = CookieOptionsHelper.CreateCsrfCookie("token", true);

        options.Path.Should().Be("/");
    }

    [Fact]
    public void CreateCsrfCookie_SetsExpiresInFuture()
    {
        var options = CookieOptionsHelper.CreateCsrfCookie("token", true);

        options.Expires.Should().BeCloseTo(DateTimeOffset.UtcNow.AddDays(30), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void AppendRefreshCookie_AppendsToResponse()
    {
        var httpContext = new DefaultHttpContext();
        var token = "refresh-token-value";

        httpContext.Response.AppendRefreshCookie(token, true);

        httpContext.Response.Headers["Set-Cookie"].ToString().Should().Contain(CookieOptionsHelper.RefreshCookieName);
    }

    [Fact]
    public void AppendCsrfCookie_AppendsToResponse()
    {
        var httpContext = new DefaultHttpContext();
        var token = "csrf-token-value";

        httpContext.Response.AppendCsrfCookie(token, true);

        httpContext.Response.Headers["Set-Cookie"].ToString().Should().Contain(CookieOptionsHelper.CsrfCookieName);
    }

    [Fact]
    public void CookieNames_AreCorrect()
    {
        CookieOptionsHelper.RefreshCookieName.Should().Be("restaurant_refresh");
        CookieOptionsHelper.CsrfCookieName.Should().Be("restaurant_csrf");
    }
}
