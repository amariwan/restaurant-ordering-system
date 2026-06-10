using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantApp.Core.DTOs.Auth;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Core.Utils;
using RestaurantApp.API.Extensions;
using System.Security.Claims;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _config;

    public AuthController(IAuthService authService, IConfiguration config)
    {
        _authService = authService;
        _config = config;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        AuthResponse response = await _authService.LoginAsync(request);
        WriteAuthCookies(response);
        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ValidateCsrfOrReferrer())
            return Unauthorized(new { message = "CSRF validation failed" });

        AuthResponse response = await _authService.RegisterAsync(request);
        WriteAuthCookies(response);
        return CreatedAtAction(nameof(Me), null, response);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        if (!ValidateCsrfOrReferrer())
            return Unauthorized(new { message = "CSRF validation failed" });

        var refresh = Request.Cookies[CookieOptionsHelper.RefreshCookieName];
        if (string.IsNullOrWhiteSpace(refresh))
            throw new UnauthorizedAccessException("No refresh token");

        var response = await _authService.RefreshTokenAsync(refresh);

        WriteAuthCookies(response);
        return Ok(response);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        if (!ValidateCsrfOrReferrer())
            return Unauthorized(new { message = "CSRF validation failed" });

        var refresh = Request.Cookies[CookieOptionsHelper.RefreshCookieName];
        if (!string.IsNullOrWhiteSpace(refresh))
        {
            await _authService.RevokeRefreshTokenAsync(refresh);
            Response.Cookies.Delete(CookieOptionsHelper.RefreshCookieName);
        }

        Response.Cookies.Delete(CookieOptionsHelper.CsrfCookieName);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _authService.GetCurrentUserAsync(User);
        return Ok(user);
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _authService.UpdateProfileAsync(userId, request);
        return Ok(user);
    }

    [HttpPut("me/password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await _authService.ChangePasswordAsync(User.GetUserId(), request);
        return Ok(user);
    }

    private void WriteAuthCookies(AuthResponse response)
    {
        if (!string.IsNullOrWhiteSpace(response.RefreshToken))
        {
            Response.AppendRefreshCookie(response.RefreshToken, Request.IsHttps);
            var csrf = CsrfTokenGenerator.Generate();
            Response.AppendCsrfCookie(csrf, Request.IsHttps);
        }
    }

    private bool ValidateCsrfOrReferrer()
    {
        var header = Request.Headers["X-CSRF-TOKEN"].FirstOrDefault();
        var cookie = Request.Cookies[CookieOptionsHelper.CsrfCookieName];
        if (!string.IsNullOrEmpty(header) && !string.IsNullOrEmpty(cookie) && header == cookie)
            return true;

        var referer = Request.Headers["Referer"].FirstOrDefault() ?? Request.Headers["Origin"].FirstOrDefault();
        if (string.IsNullOrEmpty(referer))
            return false;

        var origins = _config["CORS_ORIGINS"]?
            .Split(",", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(o => o.Trim())
            .ToArray() ?? new[] { "http://localhost:3000" };

        return OriginUtilities.IsAllowed(referer, origins);
    }
}
