using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Ayis.Api.Models;
using Ayis.Api.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Ayis.Api.Tests.Integration;

public class EdgeCaseAndValidationTests : IClassFixture<AyisApiFactory>
{
    private readonly HttpClient _client;
    private readonly AyisApiFactory _factory;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public EdgeCaseAndValidationTests(AyisApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private string GenerateValidJwt(string role = "farmer", string userId = "u-integration-test")
    {
        using var scope = _factory.Services.CreateScope();
        var authService = scope.ServiceProvider.GetRequiredService<AuthService>();
        return authService.GenerateJwtToken(new User
        {
            Id = userId,
            Username = $"user_{userId}",
            Email = $"{userId}@ayis.org",
            Role = role,
            IsActive = true
        });
    }

    [Theory]
    [InlineData("", "password123")]
    [InlineData("admin", "")]
    [InlineData("   ", "   ")]
    public async Task Login_WhitespaceOrEmptyFields_Returns400BadRequest(string username, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/token", new { Username = username, Password = password });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateFarm_EmptyName_Returns400BadRequest()
    {
        var token = GenerateValidJwt(role: "farmer");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/farms")
        {
            Content = JsonContent.Create(new { Name = "" })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateField_MissingFarmIdOrName_Returns400BadRequest()
    {
        var token = GenerateValidJwt(role: "farmer");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/fields")
        {
            Content = JsonContent.Create(new { Name = "Test Field", FarmId = "" })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateCropCycle_MissingRequiredFields_Returns400BadRequest()
    {
        var token = GenerateValidJwt(role: "farmer");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/cycles")
        {
            Content = JsonContent.Create(new { FieldId = "", CropId = "" })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateAgronomicRule_UnauthorizedRole_Returns403Forbidden()
    {
        var token = GenerateValidJwt(role: "farmer");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/agronomic-rules")
        {
            Content = JsonContent.Create(new { Title = "Test Rule", ActionDirective = "Test Action" })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateAgronomicRule_EmptyRequiredFields_Returns400BadRequest()
    {
        var token = GenerateValidJwt(role: "agronomist");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/agronomic-rules")
        {
            Content = JsonContent.Create(new { Title = "", ActionDirective = "" })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteUser_NonSuperAdminRole_Returns403Forbidden()
    {
        var token = GenerateValidJwt(role: "admin");
        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/v1/users/u-001");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ChangePassword_OtherUserWithoutAdmin_Returns403Forbidden()
    {
        var token = GenerateValidJwt(role: "farmer", userId: "u-user-A");
        var request = new HttpRequestMessage(HttpMethod.Patch, "/api/v1/users/u-user-B/password")
        {
            Content = JsonContent.Create(new { CurrentPassword = "OldPassword1!", NewPassword = "NewPassword123!" })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ChangePassword_ShortNewPassword_Returns400BadRequest()
    {
        var testUserId = $"u-pwd-{Guid.NewGuid().ToString()[..6]}";
        using (var scope = _factory.Services.CreateScope())
        {
            var userRepo = scope.ServiceProvider.GetRequiredService<Ayis.Api.Repositories.UserRepository>();
            var authService = scope.ServiceProvider.GetRequiredService<AuthService>();
            await userRepo.CreateAsync(new User
            {
                Id = testUserId,
                Username = $"user_{testUserId}",
                Email = $"{testUserId}@ayis.org",
                PasswordHash = authService.HashPassword("Password123!"),
                Role = "admin",
                IsActive = true
            });
        }

        var token = GenerateValidJwt(role: "admin", userId: testUserId);
        var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/v1/users/{testUserId}/password")
        {
            Content = JsonContent.Create(new { CurrentPassword = "Password123!", NewPassword = "short" })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task PreSeasonCropRecommendations_ExtremeWeatherInputs_ReturnsHandledResponse()
    {
        var token = GenerateValidJwt(role: "farmer");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/recommendations/pre-season-crops?rainfallMm=0&meanTempC=50&humidityPct=10&soilPh=3.0");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("recommendations");
    }

    [Fact]
    public async Task DailyDirectives_ExtremeWeatherInputs_ReturnsDirectivesGracefully()
    {
        var token = GenerateValidJwt(role: "farmer");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/recommendations/daily-directives?tempC=42&humidityPct=95&windSpeedKmh=45&rain24hMm=120");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("directives");
    }

    [Fact]
    public async Task NonExistentRoute_Returns404NotFound()
    {
        var token = GenerateValidJwt(role: "farmer");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/non-existent-route-xyz");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task MalformedBearerHeader_Returns401Unauthorized()
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/farms");
        request.Headers.TryAddWithoutValidation("Authorization", "Bearer invalid.jwt.signature");

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
