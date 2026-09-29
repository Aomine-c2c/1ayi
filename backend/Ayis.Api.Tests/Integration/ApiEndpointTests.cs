using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Ayis.Api.Models;
using Ayis.Api.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Ayis.Api.Tests.Integration;

public class ApiEndpointTests : IClassFixture<AyisApiFactory>
{
    private readonly HttpClient _client;
    private readonly AyisApiFactory _factory;
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public ApiEndpointTests(AyisApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private string GenerateValidJwt(string role = "farmer")
    {
        using var scope = _factory.Services.CreateScope();
        var authService = scope.ServiceProvider.GetRequiredService<AuthService>();
        return authService.GenerateJwtToken(new User
        {
            Id = "u-integration-test",
            Username = "integration_tester",
            Email = "integration@ayis.org",
            Role = role,
            IsActive = true
        });
    }

    [Fact]
    public async Task HealthEndpoint_Returns200_WithHealthyStatus()
    {
        var response = await _client.GetAsync("/api/v1/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
        content.Should().Contain("1.0.0");
    }

    [Fact]
    public async Task AuthToken_InvalidCredentials_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/token", new
        {
            Username = "nonexistent_user",
            Password = "WrongPassword123!"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AuthToken_EmptyPayload_Returns400()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/token", new
        {
            Username = "",
            Password = ""
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CropsEndpoint_WithoutToken_Returns401()
    {
        var response = await _client.GetAsync("/api/v1/crops");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CropsEndpoint_WithValidToken_Returns200AndSeededCrops()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/crops");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var crops = await response.Content.ReadFromJsonAsync<List<Crop>>(JsonOpts);
        crops.Should().NotBeNull();
        crops.Should().NotBeEmpty();
    }

    [Fact]
    public async Task PreSeasonCropRecommendations_WithToken_ReturnsValidEvaluation()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/recommendations/pre-season-crops?rainfallMm=720&meanTempC=21");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Scenario 1");
        content.Should().Contain("recommendations");
    }

    [Fact]
    public async Task DailyDirectives_WithToken_ReturnsValidDirectives()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/recommendations/daily-directives?tempC=22&humidityPct=85");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Scenario 2");
        content.Should().Contain("directives");
    }

    [Fact]
    public async Task WeatherCurrent_WithToken_ReturnsFallbackConditionsWhenNoApiKey()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/weather/current?lat=-17.82&lon=31.05");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var conditions = await response.Content.ReadFromJsonAsync<AccuWeatherCurrentConditions>(JsonOpts);
        conditions.Should().NotBeNull();
        conditions!.Temperature.Should().NotBeNull();
    }

    [Fact]
    public async Task FarmsEndpoint_WithValidToken_Returns200()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/farms");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task WeatherRecent_WithValidToken_Returns200()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/weather/recent");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task WeatherForecast_WithValidToken_Returns200()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/weather/forecast?lat=-17.82&lon=31.05");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task WeatherAlerts_WithValidToken_Returns200()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/weather/alerts?lat=-17.82&lon=31.05");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Tasks_WithValidToken_Returns200()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/tasks");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Inspections_WithValidToken_Returns200()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/inspections");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Notifications_WithValidToken_Returns200()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/notifications");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Reports_WithValidToken_Returns200()
    {
        var token = GenerateValidJwt();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/reports");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UsersEndpoint_FarmerRole_Returns403Forbidden()
    {
        var token = GenerateValidJwt(role: "farmer");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/users");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UsersEndpoint_AdminRole_Returns200()
    {
        var token = GenerateValidJwt(role: "admin");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/users");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AuditLogs_FarmerRole_Returns403Forbidden()
    {
        var token = GenerateValidJwt(role: "farmer");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/audit-logs");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task AuditLogs_AdminRole_Returns200()
    {
        var token = GenerateValidJwt(role: "admin");
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/audit-logs");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}

