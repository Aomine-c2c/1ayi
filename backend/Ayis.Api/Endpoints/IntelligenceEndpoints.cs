using Ayis.Api.Models;
using Ayis.Api.Repositories;
using Ayis.Api.Services;

namespace Ayis.Api.Endpoints;

public static class IntelligenceEndpoints
{
    public static IEndpointRouteBuilder MapIntelligenceEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Suitability & Yield Predictions ─────────────────────────────────

        app.MapGet("/api/v1/intelligence/suitability", async (WeatherAndIntelligenceRepository intelRepo, string fieldId) =>
        {
            var suitability = await intelRepo.GetSuitabilityByFieldAsync(fieldId);
            return Results.Ok(suitability);
        }).RequireAuthorization().WithName("GetFieldSuitability").WithTags("Intelligence");

        app.MapGet("/api/v1/intelligence/yield-predictions", async (WeatherAndIntelligenceRepository intelRepo, string cycleId) =>
        {
            var predictions = await intelRepo.GetPredictionsByCycleAsync(cycleId);
            return Results.Ok(predictions);
        }).RequireAuthorization().WithName("GetYieldPredictions").WithTags("Intelligence");

        // ── Recommendations ─────────────────────────────────────────────────

        app.MapGet("/api/v1/recommendations", async (WeatherAndIntelligenceRepository intelRepo, string? fieldId) =>
        {
            var recs = await intelRepo.GetRecommendationsAsync(fieldId);
            return Results.Ok(recs);
        }).RequireAuthorization().WithName("GetRecommendations").WithTags("Recommendations");

        // ── Scenario 1: Pre-Season Crop Selection ───────────────────────────

        app.MapGet("/api/v1/recommendations/pre-season-crops", (
            RecommendationEngineService engine,
            decimal? rainfallMm,
            decimal? meanTempC,
            decimal? humidityPct,
            decimal? soilPh,
            string? soilType,
            string? drainage) =>
        {
            var rain  = rainfallMm  ?? 680m;
            var temp  = meanTempC   ?? 21.5m;
            var hum   = humidityPct ?? 65m;
            var ph    = soilPh      ?? 6.4m;
            var soil  = soilType    ?? "Volcanic Loam";
            var dr    = drainage    ?? "Well drained";

            var results = engine.EvaluatePreSeasonCropSelection(rain, temp, hum, ph, soil, dr);
            return Results.Ok(new
            {
                scenario        = "Scenario 1: Pre-Season Crop Selection & Planning",
                inputs          = new { rainfallMm = rain, meanTempC = temp, humidityPct = hum, soilPh = ph, soilType = soil, drainage = dr },
                recommendations = results
            });
        }).RequireAuthorization().WithName("GetPreSeasonCropRecommendations").WithTags("Recommendations");

        // ── Scenario 2: In-Season Daily Directives ──────────────────────────

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
            var t   = tempC               ?? 22.4m;
            var h   = humidityPct         ?? 68m;
            var w   = windSpeedKmh        ?? 6.2m;
            var r24 = rain24hMm           ?? 18.2m;
            var r48 = forecastRain48hMm   ?? 14.0m;
            var crp = crop                ?? "Highland Hybrid Maize (H614D)";
            var stg = stage               ?? "Vegetative V6";
            var fld = field               ?? "North Field A";

            var directives = engine.EvaluateInSeasonDirectives(t, h, w, r24, r48, crp, stg, fld);
            return Results.Ok(new
            {
                scenario          = "Scenario 2: In-Season Daily Farming Operations",
                currentConditions = new { tempC = t, humidityPct = h, windSpeedKmh = w, rainLast24hMm = r24, forecastRainNext48hMm = r48 },
                cropContext       = new { crop = crp, stage = stg, field = fld },
                directives
            });
        }).RequireAuthorization().WithName("GetDailyOperationalDirectives").WithTags("Recommendations");

        // ── Agronomic Rules ─────────────────────────────────────────────────

        app.MapGet("/api/v1/agronomic-rules", async (WeatherAndIntelligenceRepository repo, string? cropId) =>
        {
            var rules = await repo.GetAgronomicRulesAsync(cropId);
            return Results.Ok(rules);
        }).RequireAuthorization().WithName("GetAgronomicRules").WithTags("AgronomicRules");

        app.MapPost("/api/v1/agronomic-rules", async (AgronomicRule rule, WeatherAndIntelligenceRepository repo) =>
        {
            if (string.IsNullOrWhiteSpace(rule.Title) || string.IsNullOrWhiteSpace(rule.ActionDirective))
                return Results.BadRequest(new { message = "Title and ActionDirective are required." });

            if (string.IsNullOrEmpty(rule.Id)) rule.Id = Guid.NewGuid().ToString();
            rule.CreatedAt = rule.UpdatedAt = DateTime.UtcNow;

            var ok = await repo.CreateAgronomicRuleAsync(rule);
            return ok
                ? Results.Created($"/api/v1/agronomic-rules/{rule.Id}", rule)
                : Results.Problem("Failed to create rule.");
        }).RequireAuthorization(p => p.RequireRole("agronomist", "admin", "super_admin", "system_admin"))
          .WithName("CreateAgronomicRule").WithTags("AgronomicRules");

        return app;
    }
}
