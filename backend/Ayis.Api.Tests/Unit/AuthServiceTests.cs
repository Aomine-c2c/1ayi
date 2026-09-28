using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Ayis.Api.Models;
using Ayis.Api.Services;

namespace Ayis.Api.Tests.Unit;

/// <summary>
/// Unit tests for AuthService — verifies BCrypt hashing, verification,
/// and JWT generation without any database or HTTP infrastructure.
/// </summary>
public class AuthServiceTests
{
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"]           = "AYIS_TEST_SIGNING_KEY_MINIMUM_32_CHARS!",
                ["Jwt:Issuer"]        = "Ayis.Api.Tests",
                ["Jwt:Audience"]      = "Ayis.Tests",
                ["Jwt:ExpiryMinutes"] = "60"
            })
            .Build();

        _sut = new AuthService(config);
    }

    // ── HashPassword ──────────────────────────────────────────────────────────

    [Fact]
    public void HashPassword_Returns_BCrypt_Format()
    {
        var hash = _sut.HashPassword("Password123!");
        hash.Should().StartWith("$2");      // BCrypt always starts with $2a$ or $2b$
        hash.Should().HaveLength(60);
    }

    [Fact]
    public void HashPassword_SameInput_ProducesDifferentHashes()
    {
        // BCrypt uses a random salt each time
        var hash1 = _sut.HashPassword("Password123!");
        var hash2 = _sut.HashPassword("Password123!");
        hash1.Should().NotBe(hash2);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    public void HashPassword_ThrowsArgumentException_ForEmptyInput(string password)
    {
        var act = () => _sut.HashPassword(password);
        act.Should().Throw<ArgumentException>();
    }

    // ── VerifyPassword ────────────────────────────────────────────────────────

    [Fact]
    public void VerifyPassword_ReturnsTrue_ForCorrectPassword()
    {
        var hash   = _sut.HashPassword("Password123!");
        var result = _sut.VerifyPassword("Password123!", hash);
        result.Should().BeTrue();
    }

    [Fact]
    public void VerifyPassword_ReturnsFalse_ForWrongPassword()
    {
        var hash   = _sut.HashPassword("CorrectPassword!");
        var result = _sut.VerifyPassword("WrongPassword!", hash);
        result.Should().BeFalse();
    }

    [Theory]
    [InlineData("", "$2a$11$validhash")]
    [InlineData("password", "")]
    [InlineData(null, "$2a$11$validhash")]
    public void VerifyPassword_ReturnsFalse_WhenEitherInputIsNullOrEmpty(string? pwd, string hash)
    {
        var result = _sut.VerifyPassword(pwd!, hash);
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_ReturnsFalse_ForMalformedHash()
    {
        // A malformed/non-BCrypt hash must be treated as auth failure, never bypass
        var result = _sut.VerifyPassword("Password123!", "not-a-bcrypt-hash");
        result.Should().BeFalse();
    }

    [Fact]
    public void VerifyPassword_NeverFallsBackToPlainTextComparison()
    {
        // Regression: the old code compared plain-text on BCrypt exception
        var plainTextPassword = "Password123!";
        var result = _sut.VerifyPassword(plainTextPassword, plainTextPassword); // same string as "hash"
        result.Should().BeFalse("plain-text fallback comparison is a security vulnerability");
    }

    // ── GenerateJwtToken ──────────────────────────────────────────────────────

    [Fact]
    public void GenerateJwtToken_ReturnsNonEmpty_WellFormedToken()
    {
        var user  = SampleUser();
        var token = _sut.GenerateJwtToken(user);

        token.Should().NotBeNullOrWhiteSpace();
        // JWT = header.payload.signature (3 Base64url segments)
        token.Split('.').Should().HaveCount(3);
    }

    [Fact]
    public void GenerateJwtToken_ContainsExpectedClaims()
    {
        var user  = SampleUser();
        var token = _sut.GenerateJwtToken(user);

        // Decode the payload (second segment) without verifying signature
        var payload = token.Split('.')[1];
        // Pad the Base64url string
        var padded  = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
        var json    = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(padded));

        json.Should().Contain(user.Id);
        json.Should().Contain(user.Username);
        json.Should().Contain(user.Role);
    }

    [Fact]
    public void GenerateJwtToken_ThrowsInvalidOperationException_WhenKeyMissing()
    {
        var emptyConfig = new ConfigurationBuilder().Build();
        var sut = new AuthService(emptyConfig);

        var act = () => sut.GenerateJwtToken(SampleUser());
        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*JWT signing key*");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static User SampleUser() => new()
    {
        Id        = "u-test-001",
        Username  = "test_farmer",
        Email     = "test@ayis.org",
        Role      = "farmer",
        IsActive  = true,
        IsStaff   = false
    };
}
