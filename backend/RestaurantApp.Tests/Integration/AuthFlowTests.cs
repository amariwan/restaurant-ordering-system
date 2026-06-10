using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using RestaurantApp.Core.DTOs.Auth;
using RestaurantApp.Core.DTOs.Users;
using RestaurantApp.Core.Enums;
using RestaurantApp.Tests.TestHelpers;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Xunit;

namespace RestaurantApp.Tests.Integration;

public class AuthFlowTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public AuthFlowTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });
    }

    private StringContent ToJsonContent(object data)
    {
        var json = JsonSerializer.Serialize(data);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    private HttpRequestMessage CreateRegisterRequest(object data)
    {
        var json = JsonSerializer.Serialize(data);
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/register")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        request.Headers.Add("Referer", "http://localhost:3000/register");
        return request;
    }

    private HttpRequestMessage CreateLogoutRequest()
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout");
        request.Headers.Add("Referer", "http://localhost:3000/logout");
        return request;
    }

    [Fact]
    public async Task Register_Login_Me_FullFlow()
    {
        var registerResponse = await _client.SendAsync(
            CreateRegisterRequest(new { name = "Flow User", email = "flow@test.com", password = "StrongPass1!" }));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var registerBody = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();
        registerBody.Should().NotBeNull();
        registerBody!.Token.Should().NotBeNullOrWhiteSpace();

        var loginResponse = await _client.PostAsync("/api/auth/login",
            JsonContent.Create(new { email = "flow@test.com", password = "StrongPass1!" }));
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        loginBody.Should().NotBeNull();
        loginBody!.Token.Should().NotBeNullOrWhiteSpace();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginBody.Token);

        var meResponse = await _client.GetAsync("/api/auth/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var meBody = await meResponse.Content.ReadFromJsonAsync<UserDto>();
        meBody.Should().NotBeNull();
        meBody!.Email.Should().Be("flow@test.com");
        meBody.Name.Should().Be("Flow User");
        meBody.Role.Should().Be(UserRole.Waiter);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        var firstResponse = await _client.SendAsync(
            CreateRegisterRequest(new { name = "First User", email = "duplicate@test.com", password = "Pass1234!" }));
        firstResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var secondResponse = await _client.SendAsync(
            CreateRegisterRequest(new { name = "Second User", email = "duplicate@test.com", password = "OtherPass1!" }));
        secondResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        await _factory.SeedSampleData();

        var response = await _client.PostAsync("/api/auth/login",
            JsonContent.Create(new { email = "waiter@test.com", password = "wrong-password-123!" }));
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_NonExistentEmail_Returns401()
    {
        var response = await _client.PostAsync("/api/auth/login",
            JsonContent.Create(new { email = "noone@example.com", password = "AnyPassword1!" }));
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_Me_WithoutToken_Returns401()
    {
        var response = await _client.GetAsync("/api/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_Me_WithInvalidToken_Returns401()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token-here");

        var response = await _client.GetAsync("/api/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Register_WithWeakPassword_Returns403()
    {
        var response = await _client.SendAsync(
            CreateRegisterRequest(new { name = "Weak Pass", email = "weak@test.com", password = "123" }));
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_Returns400()
    {
        var response = await _client.SendAsync(
            CreateRegisterRequest(new { name = "Bad Email", email = "not-an-email", password = "StrongPass1!" }));
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_Login_EmailCaseInsensitive()
    {
        var registerResponse = await _client.SendAsync(
            CreateRegisterRequest(new { name = "Case Test", email = "CaseTest@Example.COM", password = "StrongPass1!" }));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var loginResponse = await _client.PostAsync("/api/auth/login",
            JsonContent.Create(new { email = "casetest@example.com", password = "StrongPass1!" }));
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        loginBody.Should().NotBeNull();
    }

    [Fact]
    public async Task Login_ThenAccessProtectedEndpoint()
    {
        var registerResponse = await _client.SendAsync(
            CreateRegisterRequest(new { name = "Auth User", email = "authuser@test.com", password = "StrongPass1!" }));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();
        body.Should().NotBeNull();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body!.Token);

        var ordersResponse = await _client.GetAsync("/api/orders");
        ordersResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Register_AllowsEmptyName()
    {
        var response = await _client.SendAsync(
            CreateRegisterRequest(new { name = "", email = "noname@test.com", password = "StrongPass1!" }));
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        body.Should().NotBeNull();
        body!.User.Name.Should().BeEmpty();
    }

    [Fact]
    public async Task Register_WithoutReferer_Returns401()
    {
        var response = await _client.PostAsync("/api/auth/register",
            JsonContent.Create(new { name = "No Referer", email = "noreferer@test.com", password = "StrongPass1!" }));
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
