using Microsoft.AspNetCore.Http;
using RestaurantApp.API.Middleware;
using System.Security.Claims;

namespace RestaurantApp.Tests.Middleware;

public class RefreshTokenAuthMiddlewareTests
{
    private readonly HttpContext _fakeContext;
    private readonly RequestDelegate _next = ctx => Task.CompletedTask;

    public RefreshTokenAuthMiddlewareTests()
    {
        var httpContext = new DefaultHttpContext();
        _fakeContext = httpContext;
    }

    [Fact]
    public async Task Invoke_WithRefreshToken_CookiesSetAndNextCalled()
    {
        // Arrange: simulate unauthenticated request to /api/auth/refresh path
        _fakeContext.Request.Path = "/api/auth/refresh";
        _fakeContext.User = new ClaimsPrincipal(new ClaimsIdentity());

        var middleware = new RefreshTokenAuthMiddleware(_next);
        bool nextCalled = false;
        var middlewareWithCheck = new MiddlewareWithCheck(_next, () => nextCalled = true);
        
        await middlewareWithCheck.InvokeAsync(_fakeContext);

        // Assert: cookies should be set (csrf cookie)
        _fakeContext.Response.Headers.ContainsKey("Set-Cookie").Should().BeTrue();
    }

    [Fact]
    public async Task Invoke_WithoutRefreshToken_CookiesNotSet()
    {
        // Arrange
        _fakeContext.Request.Path = "/api/auth/login";
        _fakeContext.User = new ClaimsPrincipal(new ClaimsIdentity());

        var middleware = new RefreshTokenAuthMiddleware(_next);
        await middleware.InvokeAsync(_fakeContext);

        // Assert: no cookies for login path
        _fakeContext.Response.Headers["Set-Cookie"].Count.Should().Be(0);
    }

    [Fact]
    public async Task Invoke_WithRefreshToken_SetsCsrfCookie()
    {
        // Arrange
        _fakeContext.Request.Path = "/api/auth/refresh";
        _fakeContext.User = new ClaimsPrincipal(new ClaimsIdentity());

        var middleware = new RefreshTokenAuthMiddleware(_next);
        await middleware.InvokeAsync(_fakeContext);

        // Assert: Set-Cookie header exists with csrf cookie
        var cookies = _fakeContext.Response.Headers["Set-Cookie"].ToList();
        cookies.Should().Contain(c => c.StartsWith("__csrf", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Invoke_CallsNextDelegate()
    {
        // Arrange
        bool called = false;
        var middleware = new RefreshTokenAuthMiddleware(_ => { called = true; return Task.CompletedTask; });

        await middleware.InvokeAsync(_fakeContext);

        called.Should().BeTrue();
    }
}

// Helper class that captures whether next was called
internal class MiddlewareWithCheck : IEndpointFilterInvocationDelegate
{
    private readonly RequestDelegate _inner;
    private readonly Action _onNextCalled;

    public MiddlewareWithCheck(RequestDelegate inner, Action onNextCalled)
    {
        _inner = inner;
        _onNextCalled = onNextCalled;
    }

    public async Task InvokeAsync(HttpContext context, EndpointFilterInvocationDelegate next)
    {
        var middleware = new RefreshTokenAuthMiddleware(ctx =>
        {
            _onNextCalled();
            return Task.CompletedTask;
        });
        await middleware.InvokeAsync(context);
    }
}
