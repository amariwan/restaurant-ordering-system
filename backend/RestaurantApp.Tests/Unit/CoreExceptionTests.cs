using FluentAssertions;
using RestaurantApp.Core.Exceptions;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class CoreExceptionTests
{
    [Fact]
    public void BadRequestException_SetsMessage()
    {
        var ex = new BadRequestException("bad input");

        ex.Message.Should().Be("bad input");
        ex.Should().BeAssignableTo<Exception>();
    }

    [Fact]
    public void NotFoundException_SetsMessage()
    {
        var ex = new NotFoundException("not found");

        ex.Message.Should().Be("not found");
        ex.Should().BeAssignableTo<Exception>();
    }

    [Fact]
    public void ConflictException_SetsMessage()
    {
        var ex = new ConflictException("conflict");

        ex.Message.Should().Be("conflict");
        ex.Should().BeAssignableTo<Exception>();
    }

    [Fact]
    public void ForbiddenException_SetsMessage()
    {
        var ex = new ForbiddenException("forbidden");

        ex.Message.Should().Be("forbidden");
        ex.Should().BeAssignableTo<Exception>();
    }
}
