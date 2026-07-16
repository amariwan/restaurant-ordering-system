using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RestaurantApp.Core.DTOs.Auth;
using RestaurantApp.Core.DTOs.Users;
using RestaurantApp.Core.Entities;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Exceptions;
using RestaurantApp.Core.Interfaces;
using RestaurantApp.Infrastructure.Data;

namespace RestaurantApp.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly string _jwtSecret;
    private readonly int _jwtExpiryHours;
    private readonly int _refreshTokenExpiryDays;
    private readonly IMapper _mapper;

    public AuthService(AppDbContext db, IConfiguration config, IMapper mapper)
    {
        _db = db;
        _config = config;
        _jwtSecret = _config["JWT_SECRET"] ?? string.Empty;
        if (string.IsNullOrWhiteSpace(_jwtSecret) || _jwtSecret.Length < 32)
            throw new InvalidOperationException("JWT_SECRET is not configured or too short (min 32 chars)");

        _jwtExpiryHours = int.TryParse(_config["JWT_EXPIRY_HOURS"], NumberStyles.Integer, CultureInfo.InvariantCulture, out var h) ? h : 8;
        _refreshTokenExpiryDays = int.TryParse(_config["REFRESH_TOKEN_EXPIRY_DAYS"], NumberStyles.Integer, CultureInfo.InvariantCulture, out var d) ? d : 30;
        _mapper = mapper;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new ConflictException($"Email {request.Email} is already in use");

        var email = request.Email.Trim().ToLowerInvariant();

        var user = new User
        {
            Name = request.Name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
            Role = UserRole.Waiter
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = GenerateToken(user);
        var refresh = await CreateAndStoreRefreshTokenAsync(user);

        return new AuthResponse
        {
            Token = token,
            RefreshToken = refresh,
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(ClaimsPrincipal userPrincipal)
    {
        var userIdClaim = userPrincipal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
            throw new ForbiddenException("Invalid user claims");

        if (!int.TryParse(userIdClaim, out var userId))
            throw new ForbiddenException("Invalid user ID in claims");

        var user = await _db.Users.FindAsync(userId)
            ?? throw new NotFoundException("User not found");

        return _mapper.Map<UserDto>(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email)
            ?? throw new NotFoundException("Invalid email or password");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new ForbiddenException("Invalid email or password");

        var token = GenerateToken(user);
        var refresh = await CreateAndStoreRefreshTokenAsync(user);

        return new AuthResponse
        {
            Token = token,
            RefreshToken = refresh,
            User = _mapper.Map<UserDto>(user)
        };
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            signingCredentials: creds,
            expires: DateTime.UtcNow.AddHours(_jwtExpiryHours),
            claims: claims);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashToken(string token)
    {
        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = sha.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }

    private async Task<string> CreateAndStoreRefreshTokenAsync(User user)
    {
        // Generate a cryptographically secure random token (base64url)
        var random = new byte[64];
        RandomNumberGenerator.Fill(random);
        var plain = Convert.ToBase64String(random)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        var tokenHash = HashToken(plain);

        var refresh = new RefreshToken
        {
            TokenHash = tokenHash,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays)
        };

        _db.RefreshTokens.Add(refresh);
        await _db.SaveChangesAsync();

        return plain;
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            throw new ForbiddenException("Invalid refresh token");

        var tokenHash = HashToken(refreshToken);
        var stored = await _db.RefreshTokens.Include(r => r.User).FirstOrDefaultAsync(r => r.TokenHash == tokenHash)
            ?? throw new ForbiddenException("Invalid refresh token");

        if (!stored.IsActive)
            throw new ForbiddenException("Refresh token expired or revoked");

        var user = stored.User!;

        // Revoke current
        stored.RevokedAt = DateTime.UtcNow;

        // Create new refresh token (rotation)
        var newPlain = await CreateAndStoreRefreshTokenAsync(user);

        await _db.SaveChangesAsync();

        var access = GenerateToken(user);

        return new AuthResponse
        {
            Token = access,
            RefreshToken = newPlain,
            User = _mapper.Map<UserDto>(user)
        };
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return;
        var tokenHash = HashToken(refreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == tokenHash);
        if (stored == null) return;
        if (stored.RevokedAt == null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new NotFoundException("User not found");

        var email = request.Email.Trim().ToLowerInvariant();

        if (email != user.Email && await _db.Users.AnyAsync(u => u.Email == email))
            throw new ConflictException($"Email {email} is already in use");

        user.Name = request.Name;
        user.Email = email;

        await _db.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }

    public async Task<UserDto> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new NotFoundException("User not found");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw new BadRequestException("Current password is incorrect");

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
            throw new BadRequestException("New password must be at least 8 characters long");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
        await _db.SaveChangesAsync();

        return _mapper.Map<UserDto>(user);
    }
}
