using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Ayis.Api.Data;
using Ayis.Api.Repositories;
using Ayis.Api.Services;
using Ayis.Api.Endpoints;

// ============================================================================
// AYIS — Agricultural Yield Intelligence System
// C# ASP.NET Core 8 Minimal API Entry Point
// ============================================================================

var builder = WebApplication.CreateBuilder(args);

// Load environment variables — these OVERRIDE appsettings.json values.
// In production set: JWT_KEY, ACCUWEATHER_API_KEY, ConnectionStrings__DefaultConnection
builder.Configuration.AddEnvironmentVariables();

// ── 1. Database Connection Factory ──────────────────────────────────────────
// Uses MySQL 8 when DefaultConnection contains "Server="; otherwise SQLite (dev).
var connString  = builder.Configuration.GetConnectionString("DefaultConnection");
var isMySql     = !string.IsNullOrEmpty(connString)
                  && connString.Contains("Server=", StringComparison.OrdinalIgnoreCase)
                  && !connString.Contains("your_db_password", StringComparison.OrdinalIgnoreCase);
var sqlitePath  = Path.Combine(builder.Environment.ContentRootPath, "ayis.db");
var sqliteConn  = $"Data Source={sqlitePath}";

if (isMySql)
    builder.Services.AddSingleton<IDbConnectionFactory>(_ => new MySqlConnectionFactory(builder.Configuration));
else
    builder.Services.AddSingleton<IDbConnectionFactory>(_ => new SqliteConnectionFactory(sqliteConn));

// ── 2. Repository & Service Registrations ────────────────────────────────────
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<FarmRepository>();
builder.Services.AddScoped<CropRepository>();
builder.Services.AddScoped<WeatherAndIntelligenceRepository>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddSingleton<RecommendationEngineService>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<AccuWeatherService>();
builder.Services.AddHostedService<WeatherPollingService>();

// ── 3. JWT Authentication ────────────────────────────────────────────────────
// Key MUST be ≥ 32 characters in production; a random dev key is generated otherwise.
var jwtKey = builder.Configuration["Jwt:Key"] ?? builder.Configuration["JWT_KEY"];

if (string.IsNullOrEmpty(jwtKey))
{
    if (builder.Environment.IsProduction())
    {
        throw new InvalidOperationException(
            "JWT signing key is not configured. Set 'Jwt:Key' in appsettings.json " +
            "or the 'JWT_KEY' environment variable (minimum 32 characters).");
    }
    jwtKey = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
    Console.WriteLine("[WARNING] Using auto-generated JWT key — INSECURE. Never use in production.");
}

var jwtKeyBytes = Encoding.UTF8.GetBytes(jwtKey);
var jwtIssuer   = builder.Configuration["Jwt:Issuer"]   ?? "Ayis.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "Ayis.Frontend";

builder.Services
    .AddAuthentication(o =>
    {
        o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        o.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(o =>
    {
        o.RequireHttpsMetadata = builder.Environment.IsProduction(); // Enforce HTTPS in prod
        o.SaveToken            = true;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(jwtKeyBytes),
            ValidateIssuer           = true,
            ValidIssuer              = jwtIssuer,
            ValidateAudience         = true,
            ValidAudience            = jwtAudience,
            ClockSkew                = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── 4. CORS ──────────────────────────────────────────────────────────────────
// Load allowed origins from configuration; never wildcard in production.
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<List<string>>()
    ?? new List<string> { "http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:8080" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ── 5. OpenAPI / Swagger ─────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "AYIS API — Agricultural Yield Intelligence System",
        Version     = "v1",
        Description = "C# .NET 8 Minimal API backend with Dapper + MySQL 8 spatial engine"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization. Enter: Bearer {token}",
        Name        = "Authorization",
        In          = ParameterLocation.Header,
        Type        = SecuritySchemeType.ApiKey,
        Scheme      = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{
        new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        },
        Array.Empty<string>()
    }});
});

// ── Build ────────────────────────────────────────────────────────────────────
var app = builder.Build();

// Auto-initialise SQLite schema & seed data on startup (dev / SQLite mode only)
if (!isMySql)
{
    using var scope    = app.Services.CreateScope();
    var dbFactory      = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();
    SqliteDatabaseInitializer.Initialize(dbFactory);
}

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "AYIS API v1"));
}

app.UseAuthentication();
app.UseAuthorization();

// ── Health Check (public — used by run.sh to poll readiness) ─────────────────
app.MapGet("/api/v1/health", () => Results.Ok(new
{
    status    = "healthy",
    timestamp = DateTime.UtcNow,
    stack     = "C# .NET 8 Minimal API + Dapper",
    version   = "1.0.0"
})).AllowAnonymous().WithName("HealthCheck").WithTags("System");

// ── Modular Endpoint Registration ────────────────────────────────────────────
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapFarmEndpoints();
app.MapCropEndpoints();
app.MapWeatherEndpoints();
app.MapIntelligenceEndpoints();
app.MapOperationsEndpoints();

app.Run();

// Expose Program class for WebApplicationFactory in test projects
public partial class Program { }

