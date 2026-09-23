using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Ayis.Api.Repositories;
using Ayis.Api.Models;

namespace Ayis.Api.Services;

public class WeatherPollingService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<WeatherPollingService> _logger;
    private static readonly TimeSpan PollingInterval = TimeSpan.FromMinutes(30);

    public WeatherPollingService(IServiceProvider services, ILogger<WeatherPollingService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WeatherPollingService is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollWeatherAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while polling weather data.");
            }

            // Wait for next poll
            await Task.Delay(PollingInterval, stoppingToken);
        }

        _logger.LogInformation("WeatherPollingService is stopping.");
    }

    private async Task PollWeatherAsync(CancellationToken stoppingToken)
    {
        using var scope = _services.CreateScope();
        var farmRepo = scope.ServiceProvider.GetRequiredService<FarmRepository>();
        var accuWeather = scope.ServiceProvider.GetRequiredService<AccuWeatherService>();

        _logger.LogInformation("Polling weather for all farms...");
        var farms = await farmRepo.GetAllAsync();

        foreach (var farm in farms)
        {
            if (stoppingToken.IsCancellationRequested) break;

            if (farm.Latitude.HasValue && farm.Longitude.HasValue)
            {
                var lat = farm.Latitude.Value;
                var lon = farm.Longitude.Value;

                _logger.LogInformation("Fetching weather for farm {FarmName} at ({Lat}, {Lon})", farm.Name, lat, lon);
                var conditions = await accuWeather.GetCurrentConditionsAsync(lat, lon);

                if (conditions != null)
                {
                    _logger.LogInformation("Weather fetched successfully for farm {FarmName}. Temp: {Temp}C", farm.Name, conditions.Temperature.Value);
                }
            }
        }
    }
}
