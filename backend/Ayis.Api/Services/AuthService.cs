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
        try
        {
            return BCrypt.Net.BCrypt.Verify(providedPassword, storedHash);
        }
        catch
        {
            // Fallback for demo or plain password match if test user
            return providedPassword == storedHash;
        }
    }

    public string GenerateJwtToken(User user)
    {
        var secretKey = _config["Jwt:Key"] ?? "AYIS_ULTRA_SECURE_SECRET_KEY_FOR_JWT_TOKEN_SIGNING_2026_CHANGE_IN_PROD!";
        var issuer = _config["Jwt:Issuer"] ?? "Ayis.Api";
        var audience = _config["Jwt:Audience"] ?? "Ayis.Frontend";
        var expiryMinutes = int.TryParse(_config["Jwt:ExpiryMinutes"], out var exp) ? exp : 1440;

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
