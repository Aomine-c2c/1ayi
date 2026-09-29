using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Ayis.Api.Models;
using Ayis.Api.Repositories;
using Ayis.Api.Services;

namespace Ayis.Api.Services;

/// <summary>
/// Background service that polls AccuWeather for all active farms on a 30-minute cycle
/// and persists the telemetry into the weather_observations table.
/// </summary>
public class WeatherPollingService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<WeatherPollingService> _logger;

    // Poll every 30 minutes; AccuWeather free-tier allows ~50 calls/day
    private static readonly TimeSpan PollingInterval = TimeSpan.FromMinutes(30);

    // Avoid hammering the external API — insert a short delay between farm calls
    private static readonly TimeSpan DelayBetweenFarms = TimeSpan.FromSeconds(2);

    public WeatherPollingService(IServiceProvider services, ILogger<WeatherPollingService> logger)
    {
        _services = services;
        _logger   = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[WeatherPolling] Service started. Poll interval: {Interval}.", PollingInterval);

        // Small initial delay to let the rest of the application start up
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollAndPersistWeatherAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[WeatherPolling] Unhandled error during poll cycle. Will retry in {Interval}.", PollingInterval);
            }

            await Task.Delay(PollingInterval, stoppingToken);
        }

        _logger.LogInformation("[WeatherPolling] Service stopped.");
    }

    private async Task PollAndPersistWeatherAsync(CancellationToken stoppingToken)
    {
        using var scope      = _services.CreateScope();
        var farmRepo         = scope.ServiceProvider.GetRequiredService<FarmRepository>();
        var weatherRepo      = scope.ServiceProvider.GetRequiredService<WeatherAndIntelligenceRepository>();
        var accuWeather      = scope.ServiceProvider.GetRequiredService<AccuWeatherService>();

        var farms = (await farmRepo.GetAllAsync()).ToList();
        if (farms.Count == 0)
        {
            _logger.LogDebug("[WeatherPolling] No active farms found. Skipping cycle.");
            return;
        }

        _logger.LogInformation("[WeatherPolling] Starting poll for {Count} farms.", farms.Count);
        int persisted = 0, skipped = 0, failed = 0;

        foreach (var farm in farms)
        {
            if (stoppingToken.IsCancellationRequested) break;

            // Skip farms without valid coordinates
            if (farm.Latitude == 0 && farm.Longitude == 0)
            {
                _logger.LogDebug("[WeatherPolling] Farm '{Name}' ({Id}) has no GPS coordinates; skipping.", farm.Name, farm.Id);
                skipped++;
                continue;
            }

            try
            {
                var conditions = await accuWeather.GetCurrentConditionsAsync(farm.Latitude, farm.Longitude);

                if (conditions == null)
                {
                    _logger.LogWarning("[WeatherPolling] No conditions returned for farm '{Name}'. Skipping.", farm.Name);
                    skipped++;
                    continue;
                }

                // Build and persist the observation record
                var observation = new WeatherObservation
                {
                    Id              = $"wobs-{Guid.NewGuid():N}",
                    StationId       = $"farm-{farm.Id}",
                    Timestamp       = DateTime.UtcNow,
                    TemperatureC    = (decimal)conditions.Temperature.Value,
                    TempMinC        = null,
                    TempMaxC        = null,
                    HumidityPct     = (decimal)conditions.RelativeHumidity,
                    RainfallMm      = (decimal)conditions.PrecipitationLast24hMm,
                    WindSpeedKmh    = conditions.Wind != null ? (decimal?)conditions.Wind.Speed : null,
                    SolarRadiationMj= null
                };

                await weatherRepo.CreateWeatherObservationAsync(observation);
                persisted++;

                _logger.LogDebug("[WeatherPolling] Persisted observation for farm '{Name}': {Temp}°C, {Hum}% RH.",
                    farm.Name, observation.TemperatureC, observation.HumidityPct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[WeatherPolling] Failed to fetch/persist weather for farm '{Name}'.", farm.Name);
                failed++;
            }

            // Rate-limit: brief pause between external API calls
            if (!stoppingToken.IsCancellationRequested)
                await Task.Delay(DelayBetweenFarms, stoppingToken);
        }

        _logger.LogInformation("[WeatherPolling] Cycle complete. Persisted: {P}, Skipped: {S}, Failed: {F}.",
            persisted, skipped, failed);
    }
}
