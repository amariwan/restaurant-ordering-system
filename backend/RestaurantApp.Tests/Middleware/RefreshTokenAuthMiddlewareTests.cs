using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestaurantApp.API.Middleware;
using RestaurantApp.Core.Interfaces;
using System.Security.Claims;

namespace RestaurantApp.Tests.Middleware;

public class RefreshTokenAuthMiddlewareTests
{
    private readonly HttpContext _fakeContext;
    private readonly Mock<IAuthService> _authServiceMock = new();
    private static readonly NullLogger<RefreshTokenAuthMiddleware> _logger = NullLogger<RefreshTokenAuthMiddleware>.Instance;

    public RefreshTokenAuthMiddlewareTests()
    {
        _fakeContext = new DefaultHttpContext();
    }

    [Fact]
    public async Task Invoke_SkipsAuthPaths_CallsNextDirectly()
    {
        _fakeContext.Request.Path = "/api/auth/refresh";
        _fakeContext.User = new ClaimsPrincipal(new ClaimsIdentity());

        bool nextCalled = false;
        var middleware = new RefreshTokenAuthMiddleware(_ => { nextCalled = true; return Task.CompletedTask; }, _logger);

        await middleware.InvokeAsync(_fakeContext, _authServiceMock.Object);

        nextCalled.Should().BeTrue();
        _authServiceMock.Verify(a => a.RefreshTokenAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Invoke_WithoutRefreshCookie_DoesNotCallAuthService()
    {
        _fakeContext.Request.Path = "/api/orders";
        _fakeContext.User = new ClaimsPrincipal(new ClaimsIdentity());

        var middleware = new RefreshTokenAuthMiddleware(_ => Task.CompletedTask, _logger);

        await middleware.InvokeAsync(_fakeContext, _authServiceMock.Object);

        _authServiceMock.Verify(a => a.RefreshTokenAsync(It.IsAny<string>()), Times.Never);
        _fakeContext.Response.Headers["Set-Cookie"].Count.Should().Be(0);
    }

    [Fact]
    public async Task Invoke_WithAuthorizationHeader_SkipsRefreshLogic()
    {
        _fakeContext.Request.Path = "/api/orders";
        _fakeContext.Request.Headers.Authorization = "Bearer existing_token";

        var middleware = new RefreshTokenAuthMiddleware(_ => Task.CompletedTask, _logger);

        await middleware.InvokeAsync(_fakeContext, _authServiceMock.Object);

        _authServiceMock.Verify(a => a.RefreshTokenAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Invoke_CallsNextDelegate()
    {
        bool called = false;
        var middleware = new RefreshTokenAuthMiddleware(_ => { called = true; return Task.CompletedTask; }, _logger);

        await middleware.InvokeAsync(_fakeContext, _authServiceMock.Object);

        called.Should().BeTrue();
    }
}
