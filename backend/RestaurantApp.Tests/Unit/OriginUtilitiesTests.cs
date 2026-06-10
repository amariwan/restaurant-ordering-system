using FluentAssertions;
using RestaurantApp.Core.Utils;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class OriginUtilitiesTests
{
    [Fact]
    public void IsAllowed_NullReferer_ReturnsFalse()
    {
        OriginUtilities.IsAllowed(null!, new[] { "http://localhost:3000" }).Should().BeFalse();
    }

    [Fact]
    public void IsAllowed_EmptyReferer_ReturnsFalse()
    {
        OriginUtilities.IsAllowed("", new[] { "http://localhost:3000" }).Should().BeFalse();
    }

    [Fact]
    public void IsAllowed_InvalidUrl_ReturnsFalse()
    {
        OriginUtilities.IsAllowed("not-a-url", new[] { "http://localhost:3000" }).Should().BeFalse();
    }

    [Fact]
    public void IsAllowed_MatchingOrigin_ReturnsTrue()
    {
        var result = OriginUtilities.IsAllowed(
            "http://localhost:3000/menu",
            new[] { "http://localhost:3000" });

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAllowed_DifferentPort_ReturnsFalse()
    {
        var result = OriginUtilities.IsAllowed(
            "http://localhost:5000",
            new[] { "http://localhost:3000" });

        result.Should().BeFalse();
    }

    [Fact]
    public void IsAllowed_DifferentScheme_ReturnsFalse()
    {
        var result = OriginUtilities.IsAllowed(
            "https://localhost:3000",
            new[] { "http://localhost:3000" });

        result.Should().BeFalse();
    }

    [Fact]
    public void IsAllowed_LocalhostTo127_0_0_1_ReturnsTrue()
    {
        var result = OriginUtilities.IsAllowed(
            "http://127.0.0.1:3000",
            new[] { "http://localhost:3000" });

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAllowed_LocalhostTo0_0_0_0_ReturnsTrue()
    {
        var result = OriginUtilities.IsAllowed(
            "http://0.0.0.0:3000",
            new[] { "http://localhost:3000" });

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAllowed_EmptyAllowedOrigins_ReturnsFalse()
    {
        var result = OriginUtilities.IsAllowed(
            "http://localhost:3000",
            Array.Empty<string>());

        result.Should().BeFalse();
    }

    [Fact]
    public void IsAllowed_MultipleOrigins_SecondMatches()
    {
        var result = OriginUtilities.IsAllowed(
            "http://example.com",
            new[] { "http://localhost:3000", "http://example.com" });

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAllowed_InvalidOriginInAllowedList_IgnoresIt()
    {
        var result = OriginUtilities.IsAllowed(
            "http://valid.com",
            new[] { "not-a-valid-uri", "http://valid.com" });

        result.Should().BeTrue();
    }

    [Fact]
    public void IsAllowed_DefaultPortMatch_ReturnsTrue()
    {
        var result = OriginUtilities.IsAllowed(
            "http://localhost:80",
            new[] { "http://localhost" });

        result.Should().BeTrue();
    }
}
