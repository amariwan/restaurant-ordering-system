using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using RestaurantApp.API.Middleware;
using RestaurantApp.Core.Exceptions;

namespace RestaurantApp.Tests.Middleware;

public class ExceptionMiddlewareTests
{
    private readonly HttpContext _fakeContext;
    private readonly ExceptionMiddleware _middleware;

    private static readonly NullLogger<ExceptionMiddleware> _logger = NullLogger<ExceptionMiddleware>.Instance;

    public ExceptionMiddlewareTests()
    {
        var httpContext = new DefaultHttpContext();
        _fakeContext = httpContext;
        _middleware = new ExceptionMiddleware(_ => Task.CompletedTask, _logger);
    }

    [Fact]
    public async Task Invoke_WithNoException_PassesThrough()
    {
        var responseStatusBefore = 500; // Set an artificial error status
        _fakeContext.Response.StatusCode = responseStatusBefore;

        await _middleware.InvokeAsync(_fakeContext);

        _fakeContext.Response.StatusCode.Should().Be(responseStatusBefore);
    }

    [Fact]
    public async Task Invoke_WithNotFoundException_Returns404()
    {
        // Arrange: middleware that throws
        var middleware = new ExceptionMiddleware(ctx =>
        {
            throw new NotFoundException("Item nicht gefunden");
        }, _logger);

        // Act
        await middleware.InvokeAsync(_fakeContext);

        // Assert
        _fakeContext.Response.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task Invoke_WithBadRequestException_Returns400()
    {
        // Arrange
        var middleware = new ExceptionMiddleware(ctx =>
        {
            throw new BadRequestException("Ungültige Eingabe");
        }, _logger);

        // Act
        await middleware.InvokeAsync(_fakeContext);

        // Assert
        _fakeContext.Response.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task Invoke_WithForbiddenException_Returns403()
    {
        var middleware = new ExceptionMiddleware(ctx =>
        {
            throw new ForbiddenException("Zugriff verweigert");
        }, _logger);

        await middleware.InvokeAsync(_fakeContext);

        _fakeContext.Response.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task Invoke_WithConflictException_Returns409()
    {
        var middleware = new ExceptionMiddleware(ctx =>
        {
            throw new ConflictException("Konflikt aufgetreten");
        }, _logger);

        await middleware.InvokeAsync(_fakeContext);

        _fakeContext.Response.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Invoke_WithGenericException_Returns500()
    {
        var contextForTest = new DefaultHttpContext();
        var middleware2 = new ExceptionMiddleware(ctx =>
        {
            throw new InvalidOperationException("Unerwarteter Fehler");
        }, _logger);

        await middleware2.InvokeAsync(contextForTest);

        contextForTest.Response.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task Invoke_WithGenericException_IncludesErrorMessage()
    {
        var context = new DefaultHttpContext();
        var bodyStream = new System.IO.MemoryStream();
        context.Response.Body = bodyStream;

        var middleware = new ExceptionMiddleware(ctx =>
        {
            throw new InvalidOperationException("Something broke");
        }, _logger);

        await middleware.InvokeAsync(context);

        bodyStream.Seek(0, System.IO.SeekOrigin.Begin);
        var responseBody = await new System.IO.StreamReader(bodyStream).ReadToEndAsync();
        (responseBody.Contains("interner Fehler", StringComparison.OrdinalIgnoreCase) ||
         responseBody.Contains("error", StringComparison.OrdinalIgnoreCase)).Should().BeTrue();
    }
}
