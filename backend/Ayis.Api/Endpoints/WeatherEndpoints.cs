using Ayis.Api.Models;
using Ayis.Api.Repositories;
using Ayis.Api.Services;

namespace Ayis.Api.Endpoints;

public static class WeatherEndpoints
{
    public static IEndpointRouteBuilder MapWeatherEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Internal DB Observations ────────────────────────────────────────

        app.MapGet("/api/v1/weather/recent", async (WeatherAndIntelligenceRepository weatherRepo) =>
        {
            var obs = await weatherRepo.GetRecentObservationsAsync();
            return Results.Ok(obs);
        }).RequireAuthorization().WithName("GetRecentWeather").WithTags("Weather");

        // ── AccuWeather Proxy ───────────────────────────────────────────────

        app.MapGet("/api/v1/weather/current", async (double lat, double lon, AccuWeatherService accuWeather) =>
        {
            var conditions = await accuWeather.GetCurrentConditionsAsync(lat, lon);
            return conditions != null
                ? Results.Ok(conditions)
                : Results.Problem("Unable to fetch current conditions from AccuWeather.", statusCode: 502);
        }).RequireAuthorization().WithName("GetCurrentWeather").WithTags("AccuWeather");

        app.MapGet("/api/v1/weather/forecast", async (double lat, double lon, AccuWeatherService accuWeather) =>
        {
            var forecast = await accuWeather.GetFiveDayForecastAsync(lat, lon);
            return forecast != null
                ? Results.Ok(forecast)
                : Results.Problem("Unable to fetch forecast from AccuWeather.", statusCode: 502);
        }).RequireAuthorization().WithName("GetWeatherForecast").WithTags("AccuWeather");

        app.MapGet("/api/v1/weather/alerts", async (double lat, double lon, AccuWeatherService accuWeather) =>
        {
            var alerts = await accuWeather.GetAlertsAsync(lat, lon);
            return Results.Ok(alerts);
        }).RequireAuthorization().WithName("GetWeatherAlerts").WithTags("AccuWeather");

        app.MapGet("/api/v1/weather/location-key", async (double lat, double lon, AccuWeatherService accuWeather) =>
        {
            var key = await accuWeather.GetLocationKeyAsync(lat, lon);
            return key != null
                ? Results.Ok(new { locationKey = key, lat, lon })
                : Results.Problem("Unable to resolve AccuWeather location key.", statusCode: 502);
        }).RequireAuthorization().WithName("GetWeatherLocationKey").WithTags("AccuWeather");

        return app;
    }
}
