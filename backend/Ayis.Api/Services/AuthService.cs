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

public bool VerifyPassword(string providedPassword, string storedHash)
{
    if (string.IsNullOrEmpty(providedPassword) || string.IsNullOrEmpty(storedHash))
    {
        return false;
    }

    try
    {
        return BCrypt.Net.BCrypt.Verify(providedPassword, storedHash);
    }
    catch (Exception ex)
    {
        // Log the verification failure but never fall back to plain-text comparison.
        // A malformed or non-BCrypt hash should be treated as an authentication failure,
        // not a bypass.
        Console.WriteLine($"[AuthService] BCrypt verification error: {ex.Message}");
        return false;
    }
}

public string GenerateJwtToken(User user)
{
    var secretKey = _config["Jwt:Key"] ?? _config["JWT_KEY"]
        ?? throw new InvalidOperationException("JWT signing key is not configured.");
    var issuer = _config["Jwt:Issuer"] ?? _config["JWT_ISSUER"] ?? "Ayis.Api";
    var audience = _config["Jwt:Audience"] ?? _config["JWT_AUDIENCE"] ?? "Ayis.Frontend";
    var expiryMinutes = int.TryParse(_config["Jwt:ExpiryMinutes"] ?? _config["JWT_EXPIRY_MINUTES"], out var exp) ? exp : 1440;

    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.UTF8.GetBytes(secretKey);

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("is_staff", user.IsStaff.ToString().ToLower())
        }),
        Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
        Issuer = issuer,
        Audience = audience,
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
}
}
