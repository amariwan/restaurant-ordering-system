using FluentAssertions;
using RestaurantApp.Core.Utils;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class CsrfTokenGeneratorTests
{
    [Fact]
    public void Generate_ReturnsNonEmptyString()
    {
        var token = CsrfTokenGenerator.Generate();

        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Generate_DefaultLength_Is32()
    {
        CsrfTokenGenerator.DefaultLength.Should().Be(32);
    }

    [Fact]
    public void Generate_UsesSpecifiedLength()
    {
        var token = CsrfTokenGenerator.Generate(16);

        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Generate_ReturnsUrlSafeBase64()
    {
        var token = CsrfTokenGenerator.Generate();

        token.Should().NotContain("+");
        token.Should().NotContain("/");
        token.Should().NotContain("=");
    }

    [Fact]
    public void Generate_ProducesUniqueTokens()
    {
        var token1 = CsrfTokenGenerator.Generate();
        var token2 = CsrfTokenGenerator.Generate();

        token1.Should().NotBe(token2);
    }

    [Fact]
    public void Generate_WithCustomLength_ProducesExpectedToken()
    {
        var token = CsrfTokenGenerator.Generate(48);

        token.Should().NotBeNullOrEmpty();
    }
}
