using FluentAssertions;
using RestaurantApp.API.Middleware;
using RestaurantApp.Core.Exceptions;

namespace RestaurantApp.Tests.Middleware;

public class ExceptionMiddlewareTests
{
    private readonly HttpContext _fakeContext;
    private readonly ExceptionMiddleware _middleware;

    public ExceptionMiddlewareTests()
    {
        var featureCollection = new Microsoft.Extensions.Primitives.StringValuesDictionary();
        var httpContext = new DefaultHttpContext();

        _fakeContext = httpContext;
        _middleware = new ExceptionMiddleware(httpContext =>
        {
            // Succeed - no exception
            return Task.CompletedTask;
        });
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
        });

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
        });

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
        });

        await middleware.InvokeAsync(_fakeContext);

        _fakeContext.Response.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task Invoke_WithConflictException_Returns409()
    {
        var middleware = new ExceptionMiddleware(ctx =>
        {
            throw new ConflictException("Konflikt aufgetreten");
        });

        await middleware.InvokeAsync(_fakeContext);

        _fakeContext.Response.StatusCode.Should().Be(409);
    }

    [Fact]
    public async Task Invoke_WithGenericException_Returns500()
    {
        var middleware = new ExceptionMiddleware(ctx =>
        {
            throw new InvalidOperationException("Unerwarteter Fehler");
        });

        await _middleware.InvokeAsync(_fakeContext);
        
        // Note: We need to test the original instance behavior
        // Let's create a fresh one that throws
        var contextForTest = new DefaultHttpContext();
        var middleware2 = new ExceptionMiddleware(ctx =>
        {
            throw new InvalidOperationException("Unerwarteter Fehler");
        });

        await middleware2.InvokeAsync(contextForTest);

        contextForTest.Response.StatusCode.Should().Be(500);
    }

    [Fact]
    public async Task Invoke_WithGenericException_IncludesErrorMessage()
    {
        var context = new DefaultHttpContext();
        var middleware = new ExceptionMiddleware(ctx =>
        {
            throw new InvalidOperationException("Something broke");
        });

        await middleware.InvokeAsync(context);

        var responseBody = await new System.IO.StreamReader(context.Response.Body).ReadToEndAsync();
        responseBody.Should().Contain("interner Fehler")
            .Or.Contain("error"); // Accept either German or English message
    }
}
