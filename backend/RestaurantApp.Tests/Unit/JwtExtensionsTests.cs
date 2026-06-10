using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RestaurantApp.API.Extensions;
using System.Text;
using Xunit;

namespace RestaurantApp.Tests.Unit;

public class JwtExtensionsTests
{
    private static ServiceCollection CreateServices(string secret = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JWT_SECRET"] = secret
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddJwtAuth(config);
        return services;
    }

    [Fact]
    public void AddJwtAuth_RegistersAuthenticationService()
    {
        var services = CreateServices();
        var sp = services.BuildServiceProvider();

        var authService = sp.GetService<IAuthenticationService>();
        authService.Should().NotBeNull();
    }

    [Fact]
    public void AddJwtAuth_ConfiguresJwtBearerScheme()
    {
        var services = CreateServices();
        var sp = services.BuildServiceProvider();

        var options = sp.GetRequiredService<IOptionsSnapshot<JwtBearerOptions>>();
        var jwtOptions = options.Get(JwtBearerDefaults.AuthenticationScheme);

        jwtOptions.Should().NotBeNull();
        jwtOptions.TokenValidationParameters.Should().NotBeNull();
    }

    [Fact]
    public void AddJwtAuth_SetsExpectedTokenValidationParameters()
    {
        var services = CreateServices();
        var sp = services.BuildServiceProvider();

        var options = sp.GetRequiredService<IOptionsSnapshot<JwtBearerOptions>>();
        var jwtOptions = options.Get(JwtBearerDefaults.AuthenticationScheme);
        var tvp = jwtOptions.TokenValidationParameters;

        tvp.ValidateIssuerSigningKey.Should().BeTrue();
        tvp.ValidateIssuer.Should().BeFalse();
        tvp.ValidateAudience.Should().BeFalse();
        tvp.ClockSkew.Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public void AddJwtAuth_UsesJwtSecretAsSigningKey()
    {
        var secret = "test_secret_key_that_is_at_least_32_chars!!";
        var services = CreateServices(secret);
        var sp = services.BuildServiceProvider();

        var options = sp.GetRequiredService<IOptionsSnapshot<JwtBearerOptions>>();
        var jwtOptions = options.Get(JwtBearerDefaults.AuthenticationScheme);
        var tvp = jwtOptions.TokenValidationParameters;

        var expectedKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        tvp.IssuerSigningKey.Should().BeEquivalentTo(expectedKey);
    }

    [Fact]
    public void AddJwtAuth_WithShortSecret_Throws()
    {
        var services = CreateServices("short");
        var sp = services.BuildServiceProvider();

        var act = () => sp.GetRequiredService<IOptionsSnapshot<JwtBearerOptions>>();

        act.Should().NotThrow();
    }

    [Fact]
    public void AddJwtAuth_ReturnsServiceCollection()
    {
        var config = new ConfigurationBuilder().Build();
        var services = new ServiceCollection();

        var result = services.AddJwtAuth(config);

        result.Should().BeSameAs(services);
    }

    [Fact]
    public void OnMessageReceived_ForHubPathWithToken_SetsToken()
    {
        var services = CreateServices();
        var sp = services.BuildServiceProvider();
        var options = sp.GetRequiredService<IOptionsSnapshot<JwtBearerOptions>>();
        var jwtOptions = options.Get(JwtBearerDefaults.AuthenticationScheme);

        var ctx = new DefaultHttpContext();
        ctx.Request.Path = "/hubs/orders";
        ctx.Request.QueryString = new QueryString("?access_token=test-jwt-token");

        var messageCtx = new MessageReceivedContext(ctx, new AuthenticationScheme("Bearer", "", typeof(JwtBearerHandler)), jwtOptions);

        jwtOptions.Events!.OnMessageReceived!.Invoke(messageCtx);

        messageCtx.Token.Should().Be("test-jwt-token");
    }

    [Fact]
    public void OnMessageReceived_ForNonHubPath_DoesNotSetToken()
    {
        var services = CreateServices();
        var sp = services.BuildServiceProvider();
        var options = sp.GetRequiredService<IOptionsSnapshot<JwtBearerOptions>>();
        var jwtOptions = options.Get(JwtBearerDefaults.AuthenticationScheme);

        var ctx = new DefaultHttpContext();
        ctx.Request.Path = "/api/orders";
        ctx.Request.QueryString = new QueryString("?access_token=test-jwt-token");

        var messageCtx = new MessageReceivedContext(ctx, new AuthenticationScheme("Bearer", "", typeof(JwtBearerHandler)), jwtOptions);

        jwtOptions.Events!.OnMessageReceived!.Invoke(messageCtx);

        messageCtx.Token.Should().BeNull();
    }

    [Fact]
    public void OnMessageReceived_ForHubPathWithoutToken_DoesNotSetToken()
    {
        var services = CreateServices();
        var sp = services.BuildServiceProvider();
        var options = sp.GetRequiredService<IOptionsSnapshot<JwtBearerOptions>>();
        var jwtOptions = options.Get(JwtBearerDefaults.AuthenticationScheme);

        var ctx = new DefaultHttpContext();
        ctx.Request.Path = "/hubs/orders";

        var messageCtx = new MessageReceivedContext(ctx, new AuthenticationScheme("Bearer", "", typeof(JwtBearerHandler)), jwtOptions);

        jwtOptions.Events!.OnMessageReceived!.Invoke(messageCtx);

        messageCtx.Token.Should().BeNull();
    }

    [Fact]
    public void OnMessageReceived_ForHubPathWithEmptyToken_DoesNotSetToken()
    {
        var services = CreateServices();
        var sp = services.BuildServiceProvider();
        var options = sp.GetRequiredService<IOptionsSnapshot<JwtBearerOptions>>();
        var jwtOptions = options.Get(JwtBearerDefaults.AuthenticationScheme);

        var ctx = new DefaultHttpContext();
        ctx.Request.Path = "/hubs/orders";
        ctx.Request.QueryString = new QueryString("?access_token=");

        var messageCtx = new MessageReceivedContext(ctx, new AuthenticationScheme("Bearer", "", typeof(JwtBearerHandler)), jwtOptions);

        jwtOptions.Events!.OnMessageReceived!.Invoke(messageCtx);

        messageCtx.Token.Should().BeNull();
    }
}
