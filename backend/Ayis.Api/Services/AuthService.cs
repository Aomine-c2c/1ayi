using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Ayis.Api.Models;

namespace Ayis.Api.Services;

public class AuthService
{
    private readonly IConfiguration _config;

    public AuthService(IConfiguration config)
    {
        _config = config;
    }

    /// <summary>
    /// Verifies a user-supplied password against the stored BCrypt hash.
    /// Never falls back to plain-text comparison — a malformed hash is an auth failure.
    /// </summary>
    public bool VerifyPassword(string providedPassword, string storedHash)
    {
        if (string.IsNullOrEmpty(providedPassword) || string.IsNullOrEmpty(storedHash))
            return false;

        try
        {
            return BCrypt.Net.BCrypt.Verify(providedPassword, storedHash);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[AuthService] BCrypt verification error: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Hashes a plain-text password using BCrypt with a work factor of 11.
    /// Always call this before persisting a new user's password.
    /// </summary>
    public string HashPassword(string plainTextPassword)
    {
        if (string.IsNullOrWhiteSpace(plainTextPassword))
            throw new ArgumentException("Password cannot be empty.", nameof(plainTextPassword));

        return BCrypt.Net.BCrypt.HashPassword(plainTextPassword, workFactor: 11);
    }

    /// <summary>
    /// Generates a signed JWT token for the given user with role and identity claims.
    /// The signing key MUST be set via Jwt:Key (appsettings.json) or JWT_KEY (env var) in production.
    /// </summary>
    public string GenerateJwtToken(User user)
    {
        var secretKey = _config["Jwt:Key"] ?? _config["JWT_KEY"]
            ?? throw new InvalidOperationException(
                "JWT signing key is not configured. Set 'Jwt:Key' in appsettings.json or the 'JWT_KEY' environment variable (minimum 32 characters).");

        var issuer       = _config["Jwt:Issuer"]   ?? _config["JWT_ISSUER"]   ?? "Ayis.Api";
        var audience     = _config["Jwt:Audience"] ?? _config["JWT_AUDIENCE"] ?? "Ayis.Frontend";
        var expiryMins   = int.TryParse(_config["Jwt:ExpiryMinutes"] ?? _config["JWT_EXPIRY_MINUTES"], out var exp) ? exp : 1440;

        var tokenHandler = new JwtSecurityTokenHandler();
        var key          = Encoding.UTF8.GetBytes(secretKey);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name,           user.Username),
                new Claim(ClaimTypes.Email,          user.Email),
                new Claim(ClaimTypes.Role,           user.Role),
                new Claim("is_staff",                user.IsStaff.ToString().ToLower())
            }),
            Expires            = DateTime.UtcNow.AddMinutes(expiryMins),
            Issuer             = issuer,
            Audience           = audience,
            SigningCredentials  = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
