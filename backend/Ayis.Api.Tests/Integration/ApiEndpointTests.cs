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
    public async Task GetDemoUsers_Returns200_WithDatabaseSeededUsers()
    {
        var response = await _client.GetAsync("/api/v1/auth/demo-users");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("admin");
        content.Should().Contain("johnk");
        content.Should().Contain("sarahm");
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

    [Fact]
    public async Task Register_NewFarmer_Succeeds_AndCanLoginImmediatelyWithSameDetails()
    {
        var uniqueSuffix = Guid.NewGuid().ToString()[..6];
        var username = $"farmer_{uniqueSuffix}";
        var email = $"farmer_{uniqueSuffix}@testfarms.ke";
        var password = "SecureFarmerPass123!";

        // 1. Register new farmer
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Username = username,
            Email = email,
            Password = password,
            FirstName = "Chipo",
            LastName = "Matarutse",
            PhoneNumber = "+263 77 999 1111",
            Role = "farmer"
        });

        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var regBody = await registerResponse.Content.ReadAsStringAsync();
        regBody.Should().Contain("Registration successful");
        regBody.Should().Contain(username);

        // 2. Login immediately with the exact same details
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/token", new LoginRequest(username, password));
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginDoc = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        loginDoc.GetProperty("access_token").GetString().Should().NotBeNullOrWhiteSpace();
        loginDoc.GetProperty("user").GetProperty("username").GetString().Should().Be(username);
        loginDoc.GetProperty("user").GetProperty("role").GetString().Should().Be("farmer");
    }

    [Fact]
    public async Task Register_AdministrativeRole_RequiresApproval_AndBlocksLoginUntilApproved()
    {
        var uniqueSuffix = Guid.NewGuid().ToString()[..6];
        var username = $"sysadmin_{uniqueSuffix}";
        var email = $"sysadmin_{uniqueSuffix}@ayis.org";
        var password = "SuperSecretAdminPass123!";

        // 1. Register administrative user
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Username = username,
            Email = email,
            Password = password,
            FirstName = "Tinashe",
            LastName = "Gumbo",
            Role = "system_admin"
        });

        registerResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var regBody = await registerResponse.Content.ReadAsStringAsync();
        regBody.Should().Contain("requires administrator approval");

        // 2. Login attempt should return 403 Forbidden with pending approval notice
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/auth/token", new LoginRequest(username, password));
        loginResponse.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var loginBody = await loginResponse.Content.ReadAsStringAsync();
        loginBody.Should().Contain("Account is pending administrator approval before you can sign in.");
    }

    [Fact]
    public async Task Register_DuplicateUsername_ReturnsConflict()
    {
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequest
        {
            Username = "johnk", // Already seeded in SQLite
            Email = "new_unique_email@farms.ke",
            Password = "Password123!",
            Role = "farmer"
        });

        registerResponse.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var body = await registerResponse.Content.ReadAsStringAsync();
        body.Should().Contain("Username is already taken");
    }
}


