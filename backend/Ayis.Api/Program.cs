using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Ayis.Api.Data;
using Ayis.Api.Models;
using Ayis.Api.Repositories;
using Ayis.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Services & DI
var sqlitePath = Path.Combine(builder.Environment.ContentRootPath, "ayis.db");
var sqliteConnString = $"Data Source={sqlitePath}";
builder.Services.AddSingleton<IDbConnectionFactory>(_ => new SqliteConnectionFactory(sqliteConnString));
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<FarmRepository>();
builder.Services.AddScoped<CropRepository>();
builder.Services.AddScoped<WeatherAndIntelligenceRepository>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<RecommendationEngineService>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<AccuWeatherService>();
builder.Services.AddHostedService<WeatherPollingService>();

// 2. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "AYIS_ULTRA_SECURE_SECRET_KEY_FOR_JWT_TOKEN_SIGNING_2026_CHANGE_IN_PROD!";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateIssuer = false,
        ValidateAudience = false,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 3. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 4. OpenAPI / Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "AYIS C# Minimal API (Agricultural Yield Intelligence System)", 
        Version = "v1",
        Description = "High-performance C# .NET 8 Minimal API backend powered by MySQL 8 spatial engine & Dapper"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Auto-initialize SQLite database schema & seeds
using (var scope = app.Services.CreateScope())
{
    var dbFactory = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();
    SqliteDatabaseInitializer.Initialize(dbFactory);
}

app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "AYIS API v1"));
}

app.UseAuthentication();
app.UseAuthorization();

// ==========================================
// 5. Minimal API Route Handlers
// ==========================================

// Health Check
app.MapGet("/api/v1/health", () => Results.Ok(new 
{ 
    status = "healthy", 
    timestamp = DateTime.UtcNow,
    stack = "C# .NET 8 Minimal API + Dapper + MySQL 8",
    version = "1.0.0"
})).WithName("HealthCheck").WithTags("System");

// Auth: Login
app.MapPost("/api/v1/auth/token", async (LoginRequest req, UserRepository userRepo, AuthService authService) =>
{
    var user = await userRepo.GetByUsernameOrEmailAsync(req.Username);
    if (user == null || !authService.VerifyPassword(req.Password, user.PasswordHash))
    {
        return Results.Json(new { message = "Invalid credentials" }, statusCode: 401);
    }

    var token = authService.GenerateJwtToken(user);
    return Results.Ok(new
    {
        access_token = token,
        token_type = "bearer",
        user = new
        {
            id = user.Id,
            username = user.Username,
            email = user.Email,
            role = user.Role,
            first_name = user.FirstName,
            last_name = user.LastName
        }
    });
}).WithName("Login").WithTags("Auth");

// Auth: Current User Profile
app.MapGet("/api/v1/auth/me", async (ClaimsPrincipal userPrincipal, UserRepository userRepo) =>
{
    var userId = userPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var user = await userRepo.GetByIdAsync(userId);
    return user != null ? Results.Ok(user) : Results.NotFound();
}).RequireAuthorization().WithName("GetCurrentUser").WithTags("Auth");

// Farms: List
app.MapGet("/api/v1/farms", async (FarmRepository farmRepo, ClaimsPrincipal user) =>
{
    var farms = await farmRepo.GetAllAsync();
    return Results.Ok(farms);
}).WithName("GetFarms").WithTags("Farms");

// Farms: Create
app.MapPost("/api/v1/farms", async (Farm farm, FarmRepository farmRepo) =>
{
    if (string.IsNullOrEmpty(farm.Id)) farm.Id = $"farm-{Guid.NewGuid().ToString().Substring(0, 8)}";
    if (string.IsNullOrEmpty(farm.OwnerId)) farm.OwnerId = "u-008";
    farm.CreatedAt = DateTime.UtcNow;
    var res = await farmRepo.CreateAsync(farm);
    return res > 0 ? Results.Created($"/api/v1/farms/{farm.Id}", farm) : Results.Problem("Failed to create farm");
}).WithName("CreateFarm").WithTags("Farms");

// Farms: Update
app.MapPut("/api/v1/farms/{id}", async (string id, Farm farm, FarmRepository farmRepo) =>
{
    farm.Id = id;
    var res = await farmRepo.UpdateAsync(farm);
    return res ? Results.Ok(new { success = true, farm }) : Results.NotFound();
}).WithName("UpdateFarm").WithTags("Farms");

// Farms: Detail & Fields
app.MapGet("/api/v1/farms/{id}", async (string id, FarmRepository farmRepo) =>
{
    var farm = await farmRepo.GetByIdAsync(id);
    return farm != null ? Results.Ok(farm) : Results.NotFound();
}).WithName("GetFarmById").WithTags("Farms");

app.MapGet("/api/v1/farms/{id}/fields", async (string id, FarmRepository farmRepo) =>
{
    var fields = await farmRepo.GetFieldsByFarmIdAsync(id);
    return Results.Ok(fields);
}).WithName("GetFarmFields").WithTags("Farms");

// Fields: List All or by farmId
app.MapGet("/api/v1/fields", async (string? farmId, FarmRepository farmRepo) =>
{
    var fields = string.IsNullOrEmpty(farmId)
        ? await farmRepo.GetAllFieldsAsync()
        : await farmRepo.GetFieldsByFarmIdAsync(farmId);
    return Results.Ok(fields);
}).WithName("GetFields").WithTags("Fields");

app.MapPost("/api/v1/fields", async (Field field, FarmRepository farmRepo) =>
{
    if (string.IsNullOrEmpty(field.Id)) field.Id = $"fld-{Guid.NewGuid().ToString().Substring(0, 8)}";
    var res = await farmRepo.CreateFieldAsync(field);
    return res > 0 ? Results.Created($"/api/v1/fields/{field.Id}", field) : Results.Problem("Failed to create field");
}).WithName("CreateField").WithTags("Fields");

// Crops & Catalog
app.MapGet("/api/v1/crops", async (CropRepository cropRepo) =>
{
    var crops = await cropRepo.GetAllAsync();
    return Results.Ok(crops);
}).WithName("GetCrops").WithTags("Crops");

app.MapGet("/api/v1/crops/{id}", async (string id, CropRepository cropRepo) =>
{
    var crop = await cropRepo.GetByIdAsync(id);
    return crop != null ? Results.Ok(crop) : Results.NotFound();
}).WithName("GetCropById").WithTags("Crops");

// Crop Cycles
app.MapGet("/api/v1/cycles", async (CropRepository cropRepo, string? fieldId) =>
{
    var cycles = await cropRepo.GetCyclesAsync(fieldId);
    return Results.Ok(cycles);
}).WithName("GetCycles").WithTags("Cycles");

app.MapPost("/api/v1/cycles", async (CropCycle cycle, CropRepository cropRepo) =>
{
    if (string.IsNullOrEmpty(cycle.Id)) cycle.Id = $"cyc-{Guid.NewGuid().ToString().Substring(0, 8)}";
    var res = await cropRepo.CreateCycleAsync(cycle);
    return res ? Results.Created($"/api/v1/cycles/{cycle.Id}", cycle) : Results.Problem("Failed to create cycle");
}).WithName("CreateCycle").WithTags("Cycles");

// Weather: Observations
app.MapGet("/api/v1/weather/recent", async (WeatherAndIntelligenceRepository weatherRepo) =>
{
    var obs = await weatherRepo.GetRecentObservationsAsync();
    return Results.Ok(obs);
}).WithName("GetRecentWeather").WithTags("Weather");

// Intelligence & Suitability
app.MapGet("/api/v1/intelligence/suitability", async (WeatherAndIntelligenceRepository intelRepo, string fieldId) =>
{
    var suitability = await intelRepo.GetSuitabilityByFieldAsync(fieldId);
    return Results.Ok(suitability);
}).WithName("GetFieldSuitability").WithTags("Intelligence");

// Yield Predictions
app.MapGet("/api/v1/intelligence/yield-predictions", async (WeatherAndIntelligenceRepository intelRepo, string cycleId) =>
{
    var predictions = await intelRepo.GetPredictionsByCycleAsync(cycleId);
    return Results.Ok(predictions);
}).WithName("GetYieldPredictions").WithTags("Intelligence");

// Recommendations
app.MapGet("/api/v1/recommendations", async (WeatherAndIntelligenceRepository intelRepo, string? fieldId) =>
{
    var recs = await intelRepo.GetRecommendationsAsync(fieldId);
    return Results.Ok(recs);
}).WithName("GetRecommendations").WithTags("Recommendations");

// Intelligence: Scenario 1 - Pre-Season Crop Selection & Planning
app.MapGet("/api/v1/recommendations/pre-season-crops", (
    RecommendationEngineService engine,
    decimal? rainfallMm,
    decimal? meanTempC,
    decimal? humidityPct,
    decimal? soilPh,
    string? soilType,
    string? drainage) =>
{
    var rain = rainfallMm ?? 680m;
    var temp = meanTempC ?? 21.5m;
    var hum = humidityPct ?? 65m;
    var ph = soilPh ?? 6.4m;
    var soil = soilType ?? "Volcanic Loam";
    var dr = drainage ?? "Well drained";

    var results = engine.EvaluatePreSeasonCropSelection(rain, temp, hum, ph, soil, dr);
    return Results.Ok(new
    {
        scenario = "Scenario 1: Pre-Season Crop Selection & Planning",
        inputs = new { rainfallMm = rain, meanTempC = temp, humidityPct = hum, soilPh = ph, soilType = soil, drainage = dr },
        recommendations = results
    });
}).WithName("GetPreSeasonCropRecommendations").WithTags("Recommendations");

// Intelligence: Scenario 2 - In-Season Daily Operational Farming Directives
app.MapGet("/api/v1/recommendations/daily-directives", (
    RecommendationEngineService engine,
    decimal? tempC,
    decimal? humidityPct,
    decimal? windSpeedKmh,
    decimal? rain24hMm,
    decimal? forecastRain48hMm,
    string? crop,
    string? stage,
    string? field) =>
{
    var t = tempC ?? 22.4m;
    var h = humidityPct ?? 68m;
    var w = windSpeedKmh ?? 6.2m;
    var r24 = rain24hMm ?? 18.2m;
    var r48 = forecastRain48hMm ?? 14.0m;
    var crp = crop ?? "Highland Hybrid Maize (H614D)";
    var stg = stage ?? "Vegetative V6";
    var fld = field ?? "North Field A";

    var directives = engine.EvaluateInSeasonDirectives(t, h, w, r24, r48, crp, stg, fld);
    return Results.Ok(new
    {
        scenario = "Scenario 2: In-Season Daily Farming Operations",
        currentConditions = new { tempC = t, humidityPct = h, windSpeedKmh = w, rainLast24hMm = r24, forecastRainNext48hMm = r48 },
        cropContext = new { crop = crp, stage = stg, field = fld },
        directives
    });
}).WithName("GetDailyOperationalDirectives").WithTags("Recommendations");

// Notifications
app.MapGet("/api/v1/notifications", async (WeatherAndIntelligenceRepository notifRepo) =>
{
    var notifications = await notifRepo.GetNotificationsAsync();
    return Results.Ok(notifications);
}).WithName("GetNotifications").WithTags("Notifications");

// ==========================================
// 6. AccuWeather Proxy Endpoints
// ==========================================

// AccuWeather: Current Conditions for GPS coordinates
app.MapGet("/api/v1/weather/current", async (double lat, double lon, AccuWeatherService accuWeather) =>
{
    var conditions = await accuWeather.GetCurrentConditionsAsync(lat, lon);
    if (conditions == null)
        return Results.Problem("Unable to fetch current conditions from AccuWeather.", statusCode: 502);
    return Results.Ok(conditions);
}).WithName("GetCurrentWeather").WithTags("AccuWeather");

// AccuWeather: 5-Day Forecast for GPS coordinates
app.MapGet("/api/v1/weather/forecast", async (double lat, double lon, AccuWeatherService accuWeather) =>
{
    var forecast = await accuWeather.GetFiveDayForecastAsync(lat, lon);
    if (forecast == null)
        return Results.Problem("Unable to fetch forecast from AccuWeather.", statusCode: 502);
    return Results.Ok(forecast);
}).WithName("GetWeatherForecast").WithTags("AccuWeather");

// AccuWeather: Severe Weather Alerts for GPS coordinates
app.MapGet("/api/v1/weather/alerts", async (double lat, double lon, AccuWeatherService accuWeather) =>
{
    var alerts = await accuWeather.GetAlertsAsync(lat, lon);
    return Results.Ok(alerts);
}).WithName("GetWeatherAlerts").WithTags("AccuWeather");

// AccuWeather: Location Key lookup (for debugging / farm registration)
app.MapGet("/api/v1/weather/location-key", async (double lat, double lon, AccuWeatherService accuWeather) =>
{
    var key = await accuWeather.GetLocationKeyAsync(lat, lon);
    if (key == null)
        return Results.Problem("Unable to resolve AccuWeather location key.", statusCode: 502);
    return Results.Ok(new { locationKey = key, lat, lon });
}).WithName("GetWeatherLocationKey").WithTags("AccuWeather");

// Agronomic Rules & Baselines (Authored and Maintained by Agronomist)
app.MapGet("/api/v1/agronomic-rules", async (WeatherAndIntelligenceRepository repo, string? cropId) =>
{
    var rules = await repo.GetAgronomicRulesAsync(cropId);
    return Results.Ok(rules);
}).WithName("GetAgronomicRules").WithTags("AgronomicRules");

app.MapPost("/api/v1/agronomic-rules", async (AgronomicRule rule, WeatherAndIntelligenceRepository repo) =>
{
    if (string.IsNullOrEmpty(rule.Title) || string.IsNullOrEmpty(rule.ActionDirective))
    {
        return Results.BadRequest(new { message = "Title and ActionDirective are required." });
    }
    if (string.IsNullOrEmpty(rule.Id)) rule.Id = Guid.NewGuid().ToString();
    rule.CreatedAt = DateTime.UtcNow;
    rule.UpdatedAt = DateTime.UtcNow;

    var success = await repo.CreateAgronomicRuleAsync(rule);
    return success 
        ? Results.Created($"/api/v1/agronomic-rules/{rule.Id}", rule) 
        : Results.Problem("Failed to create rule.");
}).WithName("CreateAgronomicRule").WithTags("AgronomicRules");

// ==========================================
// 7. Reports & Analytics Endpoints
// ==========================================
app.MapGet("/api/v1/reports", async (WeatherAndIntelligenceRepository repo) =>
{
    var reports = await repo.GetReportsAsync();
    return Results.Ok(reports);
}).WithName("GetReports").WithTags("Reports");

app.MapPost("/api/v1/reports/generate", async (ReportItem report, WeatherAndIntelligenceRepository repo) =>
{
    if (string.IsNullOrEmpty(report.Id)) report.Id = $"rep-{Guid.NewGuid().ToString().Substring(0, 8)}";
    report.Date = DateTime.UtcNow.ToString("yyyy-MM-dd");
    report.Status = "READY";
    report.CreatedAt = DateTime.UtcNow;
    await repo.CreateReportAsync(report);
    return Results.Created($"/api/v1/reports/{report.Id}", report);
}).WithName("GenerateReport").WithTags("Reports");

// ==========================================
// 8. Audit Logs Endpoints
// ==========================================
app.MapGet("/api/v1/audit-logs", async (WeatherAndIntelligenceRepository repo) =>
{
    var logs = await repo.GetAuditLogsAsync();
    return Results.Ok(logs);
}).WithName("GetAuditLogs").WithTags("Audit");

app.MapPost("/api/v1/audit-logs", async (AuditLogItem log, WeatherAndIntelligenceRepository repo) =>
{
    if (string.IsNullOrEmpty(log.Id)) log.Id = $"aud-{Guid.NewGuid().ToString().Substring(0, 8)}";
    log.Timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");
    await repo.CreateAuditLogAsync(log);
    return Results.Created($"/api/v1/audit-logs/{log.Id}", log);
}).WithName("CreateAuditLog").WithTags("Audit");

// ==========================================
// 9. Field Operations: Inspections, Observations, Tasks
// ==========================================
app.MapGet("/api/v1/inspections", async (WeatherAndIntelligenceRepository repo) =>
{
    var inspections = await repo.GetInspectionsAsync();
    return Results.Ok(inspections);
}).WithName("GetInspections").WithTags("FieldOperations");

app.MapPost("/api/v1/inspections", async (FieldInspectionItem inspection, WeatherAndIntelligenceRepository repo) =>
{
    if (string.IsNullOrEmpty(inspection.Id)) inspection.Id = $"insp-{Guid.NewGuid().ToString().Substring(0, 8)}";
    inspection.InspectionDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm");
    var res = await repo.CreateInspectionAsync(inspection);
    return res ? Results.Created($"/api/v1/inspections/{inspection.Id}", inspection) : Results.Problem("Failed to create inspection");
}).WithName("CreateInspection").WithTags("FieldOperations");

app.MapGet("/api/v1/observations", async (string? fieldId, WeatherAndIntelligenceRepository repo) =>
{
    var obs = await repo.GetObservationsAsync(fieldId);
    return Results.Ok(obs);
}).WithName("GetObservations").WithTags("FieldOperations");

app.MapPost("/api/v1/observations", async (FieldObservationItem obs, WeatherAndIntelligenceRepository repo) =>
{
    if (string.IsNullOrEmpty(obs.Id)) obs.Id = $"obs-{Guid.NewGuid().ToString().Substring(0, 8)}";
    obs.Date = DateTime.UtcNow.ToString("yyyy-MM-dd");
    var res = await repo.CreateObservationAsync(obs);
    return res ? Results.Created($"/api/v1/observations/{obs.Id}", obs) : Results.Problem("Failed to create observation");
}).WithName("CreateObservation").WithTags("FieldOperations");

app.MapGet("/api/v1/tasks", async (WeatherAndIntelligenceRepository repo) =>
{
    var tasks = await repo.GetTasksAsync();
    return Results.Ok(tasks);
}).WithName("GetTasks").WithTags("FieldOperations");

app.MapPatch("/api/v1/tasks/{id}/status", async (string id, TaskStatusRequest req, WeatherAndIntelligenceRepository repo) =>
{
    var res = await repo.UpdateTaskStatusAsync(id, req.Status);
    return res ? Results.Ok(new { success = true, id, status = req.Status }) : Results.NotFound();
}).WithName("UpdateTaskStatus").WithTags("FieldOperations");

// Notifications: Read / Read All
app.MapPatch("/api/v1/notifications/{id}/read", async (string id, WeatherAndIntelligenceRepository repo) =>
{
    var res = await repo.MarkNotificationAsReadAsync(id);
    return res ? Results.Ok(new { success = true }) : Results.NotFound();
}).WithName("MarkNotificationAsRead").WithTags("Notifications");

app.MapPost("/api/v1/notifications/read-all", async (WeatherAndIntelligenceRepository repo) =>
{
    await repo.MarkAllNotificationsAsReadAsync();
    return Results.Ok(new { success = true });
}).WithName("MarkAllNotificationsAsRead").WithTags("Notifications");

// ==========================================
// 10. User Management CRUD
// ==========================================
app.MapGet("/api/v1/users", async (UserRepository repo) =>
{
    var users = await repo.GetAllAsync();
    return Results.Ok(users);
}).WithName("GetUsers").WithTags("Users");

app.MapGet("/api/v1/users/{id}", async (string id, UserRepository repo) =>
{
    var user = await repo.GetByIdAsync(id);
    return user != null ? Results.Ok(user) : Results.NotFound();
}).WithName("GetUserById").WithTags("Users");

app.MapPost("/api/v1/users", async (User user, UserRepository repo) =>
{
    if (string.IsNullOrEmpty(user.Id)) user.Id = $"u-{Guid.NewGuid().ToString().Substring(0, 8)}";
    if (string.IsNullOrEmpty(user.PasswordHash)) user.PasswordHash = "Password123!";
    user.CreatedAt = DateTime.UtcNow;
    var res = await repo.CreateAsync(user);
    return res ? Results.Created($"/api/v1/users/{user.Id}", user) : Results.Problem("Failed to create user");
}).WithName("CreateUser").WithTags("Users");

app.MapPut("/api/v1/users/{id}", async (string id, User user, UserRepository repo) =>
{
    user.Id = id;
    var res = await repo.UpdateAsync(user);
    return res ? Results.Ok(new { success = true, user }) : Results.NotFound();
}).WithName("UpdateUser").WithTags("Users");

app.MapPatch("/api/v1/users/{id}/status", async (string id, UserStatusRequest req, UserRepository repo) =>
{
    var res = await repo.ToggleStatusAsync(id, req.IsActive);
    return res ? Results.Ok(new { success = true, id, isActive = req.IsActive }) : Results.NotFound();
}).WithName("ToggleUserStatus").WithTags("Users");

app.MapDelete("/api/v1/users/{id}", async (string id, UserRepository repo) =>
{
    var res = await repo.DeleteAsync(id);
    return res ? Results.Ok(new { success = true }) : Results.NotFound();
}).WithName("DeleteUser").WithTags("Users");

app.Run();

public record LoginRequest(string Username, string Password);
public record TaskStatusRequest(string Status);
public record UserStatusRequest(bool IsActive);
