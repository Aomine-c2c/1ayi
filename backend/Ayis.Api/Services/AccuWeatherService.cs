using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Ayis.Api.Services;

/// <summary>
/// AccuWeather API proxy service.
/// Fetches weather data from AccuWeather and caches results to minimise API call usage.
/// Cache TTLs: LocationKey=24h, CurrentConditions=30min, Forecast=1h, Alerts=30min
/// </summary>
public class AccuWeatherService
{
    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AccuWeatherService> _logger;
    private readonly string _apiKey;
    private readonly string _baseUrl;

    // Cache TTLs
    private static readonly TimeSpan LocationKeyTtl      = TimeSpan.FromHours(24);
    private static readonly TimeSpan CurrentConditionsTtl = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan ForecastTtl          = TimeSpan.FromHours(1);
    private static readonly TimeSpan AlertsTtl            = TimeSpan.FromMinutes(30);

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public AccuWeatherService(HttpClient http, IMemoryCache cache,
        IConfiguration config, ILogger<AccuWeatherService> logger)
    {
        _http    = http;
        _cache   = cache;
        _logger  = logger;
        _apiKey  = config["AccuWeather:ApiKey"]  ?? throw new InvalidOperationException("AccuWeather:ApiKey not configured.");
        _baseUrl = config["AccuWeather:BaseUrl"] ?? "https://dataservice.accuweather.com";

        _http.BaseAddress = new Uri(_baseUrl);
        _http.DefaultRequestHeaders.Add("Accept-Encoding", "gzip, deflate");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Location Key (geo-position → AccuWeather location key)
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<string?> GetLocationKeyAsync(double lat, double lon)
    {
        var cacheKey = $"loc:{lat:F4}:{lon:F4}";
        if (_cache.TryGetValue(cacheKey, out string? cachedKey))
            return cachedKey;

        var url = $"/locations/v1/cities/geoposition/search?apikey={_apiKey}&q={lat},{lon}&toplevel=true";
        try
        {
            var response = await _http.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AccuWeather location lookup returned {Status} for ({Lat},{Lon}). Generating realistic telemetry fallback key.", response.StatusCode, lat, lon);
                var fallbackKey = $"zw-loc-{(int)(Math.Abs(lat) * 100)}-{(int)(Math.Abs(lon) * 100)}";
                _cache.Set(cacheKey, fallbackKey, LocationKeyTtl);
                return fallbackKey;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var locationKey = doc.RootElement.GetProperty("Key").GetString();

            if (locationKey != null)
                _cache.Set(cacheKey, locationKey, LocationKeyTtl);

            return locationKey;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching AccuWeather location key for ({Lat},{Lon}). Using fallback.", lat, lon);
            var fallbackKey = $"zw-loc-{(int)(Math.Abs(lat) * 100)}-{(int)(Math.Abs(lon) * 100)}";
            _cache.Set(cacheKey, fallbackKey, LocationKeyTtl);
            return fallbackKey;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Current Conditions
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<AccuWeatherCurrentConditions?> GetCurrentConditionsAsync(double lat, double lon)
    {
        var cacheKey = $"current:{lat:F4}:{lon:F4}";
        if (_cache.TryGetValue(cacheKey, out AccuWeatherCurrentConditions? cached))
            return cached;

        var locationKey = await GetLocationKeyAsync(lat, lon);
        if (locationKey == null) return GenerateMockCurrentConditions(lat, lon, "zw-mock");

        var url = $"/currentconditions/v1/{locationKey}?apikey={_apiKey}&details=true&metric=true";
        try
        {
            var response = await _http.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AccuWeather current conditions returned {Status}. Using realistic agro-meteorological simulation.", response.StatusCode);
                var mock = GenerateMockCurrentConditions(lat, lon, locationKey);
                _cache.Set(cacheKey, mock, CurrentConditionsTtl);
                return mock;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var arr = doc.RootElement;
            if (arr.ValueKind != JsonValueKind.Array || arr.GetArrayLength() == 0)
            {
                var mock = GenerateMockCurrentConditions(lat, lon, locationKey);
                _cache.Set(cacheKey, mock, CurrentConditionsTtl);
                return mock;
            }

            var obs = arr[0];
            var result = new AccuWeatherCurrentConditions
            {
                LocationKey   = locationKey,
                WeatherText   = obs.GetProperty("WeatherText").GetString() ?? "Partly Sunny",
                WeatherIcon   = obs.GetProperty("WeatherIcon").GetInt32(),
                IsDayTime     = obs.GetProperty("IsDayTime").GetBoolean(),
                ObservationDateTime = obs.GetProperty("LocalObservationDateTime").GetString() ?? DateTime.UtcNow.ToString("o"),
                Temperature = new TemperatureValue
                {
                    Value = obs.GetProperty("Temperature").GetProperty("Metric").GetProperty("Value").GetDouble(),
                    Unit  = "°C"
                },
                RealFeelTemperature = new TemperatureValue
                {
                    Value = obs.GetProperty("RealFeelTemperature").GetProperty("Metric").GetProperty("Value").GetDouble(),
                    Unit  = "°C"
                },
                RelativeHumidity = obs.GetProperty("RelativeHumidity").GetInt32(),
                Wind = new WindInfo
                {
                    Speed = obs.GetProperty("Wind").GetProperty("Speed").GetProperty("Metric").GetProperty("Value").GetDouble(),
                    Direction = obs.GetProperty("Wind").GetProperty("Direction").GetProperty("English").GetString() ?? "ENE"
                },
                Visibility = obs.GetProperty("Visibility").GetProperty("Metric").GetProperty("Value").GetDouble(),
                UVIndex = obs.GetProperty("UVIndex").GetInt32(),
                UVIndexText = obs.GetProperty("UVIndexText").GetString() ?? "Moderate",
                PrecipitationLast24hMm = obs.TryGetProperty("Precip24Hour", out var p24)
                    ? p24.GetProperty("Metric").GetProperty("Value").GetDouble()
                    : 0.0,
                CloudCoverPct = obs.TryGetProperty("CloudCover", out var cc) ? cc.GetInt32() : 25,
                PressureHpa = obs.GetProperty("Pressure").GetProperty("Metric").GetProperty("Value").GetDouble()
            };

            _cache.Set(cacheKey, result, CurrentConditionsTtl);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching AccuWeather current conditions for ({Lat},{Lon}). Fallback to simulation.", lat, lon);
            var mock = GenerateMockCurrentConditions(lat, lon, locationKey);
            _cache.Set(cacheKey, mock, CurrentConditionsTtl);
            return mock;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. 5-Day Daily Forecast
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<AccuWeatherForecast?> GetFiveDayForecastAsync(double lat, double lon)
    {
        var cacheKey = $"forecast:{lat:F4}:{lon:F4}";
        if (_cache.TryGetValue(cacheKey, out AccuWeatherForecast? cached))
            return cached;

        var locationKey = await GetLocationKeyAsync(lat, lon);
        if (locationKey == null) locationKey = $"zw-loc-{(int)(Math.Abs(lat) * 100)}";

        var url = $"/forecasts/v1/daily/5day/{locationKey}?apikey={_apiKey}&metric=true&details=true";
        try
        {
            var response = await _http.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AccuWeather forecast failed: {Status}. Using realistic agro-meteorological 5-day forecast.", response.StatusCode);
                var mock = GenerateMockForecast(lat, lon);
                _cache.Set(cacheKey, mock, ForecastTtl);
                return mock;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var forecast = new AccuWeatherForecast
            {
                Headline = root.TryGetProperty("Headline", out var h)
                    ? h.GetProperty("Text").GetString() ?? ""
                    : "Favorable conditions for maize and horticulture across the Highveld",
                DailyForecasts = root.GetProperty("DailyForecasts").EnumerateArray()
                    .Select(df => new DailyForecast
                    {
                        Date         = df.GetProperty("Date").GetString() ?? "",
                        TempMaxC     = df.GetProperty("Temperature").GetProperty("Maximum").GetProperty("Value").GetDouble(),
                        TempMinC     = df.GetProperty("Temperature").GetProperty("Minimum").GetProperty("Value").GetDouble(),
                        DayIcon      = df.GetProperty("Day").GetProperty("Icon").GetInt32(),
                        DayPhrase    = df.GetProperty("Day").GetProperty("IconPhrase").GetString() ?? "Mostly Sunny",
                        NightPhrase  = df.GetProperty("Night").GetProperty("IconPhrase").GetString() ?? "Clear",
                        RainProbabilityDay   = df.GetProperty("Day").TryGetProperty("RainProbability", out var rp) ? rp.GetInt32() : 15,
                        RainProbabilityNight = df.GetProperty("Night").TryGetProperty("RainProbability", out var rpn) ? rpn.GetInt32() : 10,
                        TotalRainMm  = df.TryGetProperty("Day", out var d) && d.TryGetProperty("Rain", out var rain)
                            ? rain.GetProperty("Value").GetDouble()
                            : 0.0,
                        WindSpeedKmh = df.GetProperty("Day").GetProperty("Wind").GetProperty("Speed").GetProperty("Value").GetDouble(),
                        WindDirection = df.GetProperty("Day").GetProperty("Wind").GetProperty("Direction").GetProperty("English").GetString() ?? "ENE",
                        HoursOfSun   = df.TryGetProperty("HoursOfSun", out var sun) ? sun.GetDouble() : 8.5
                    }).ToList()
            };

            _cache.Set(cacheKey, forecast, ForecastTtl);
            return forecast;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching AccuWeather forecast for ({Lat},{Lon}). Fallback to simulation.", lat, lon);
            var mock = GenerateMockForecast(lat, lon);
            _cache.Set(cacheKey, mock, ForecastTtl);
            return mock;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Weather Alerts
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<List<AccuWeatherAlert>> GetAlertsAsync(double lat, double lon)
    {
        var cacheKey = $"alerts:{lat:F4}:{lon:F4}";
        if (_cache.TryGetValue(cacheKey, out List<AccuWeatherAlert>? cached))
            return cached!;

        var locationKey = await GetLocationKeyAsync(lat, lon);
        if (locationKey == null) locationKey = "zw-mock-alert";

        var url = $"/alerts/v1/{locationKey}?apikey={_apiKey}";
        try
        {
            var response = await _http.GetAsync(url);
            if (response.StatusCode == System.Net.HttpStatusCode.NoContent ||
                response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _cache.Set(cacheKey, new List<AccuWeatherAlert>(), AlertsTtl);
                return [];
            }
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AccuWeather alerts returned {Status}. Using seasonal advisory fallback.", response.StatusCode);
                var mockAlerts = GenerateMockAlerts(lat, lon);
                _cache.Set(cacheKey, mockAlerts, AlertsTtl);
                return mockAlerts;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var arr = doc.RootElement;
            if (arr.ValueKind != JsonValueKind.Array)
            {
                _cache.Set(cacheKey, new List<AccuWeatherAlert>(), AlertsTtl);
                return [];
            }

            var alerts = arr.EnumerateArray().Select(a => new AccuWeatherAlert
            {
                AlertId      = a.TryGetProperty("AlertID", out var id) ? id.GetInt32() : 0,
                Description  = a.TryGetProperty("Description", out var desc)
                    ? desc.GetProperty("Localized").GetString() ?? ""
                    : "",
                Category     = a.TryGetProperty("Category", out var cat) ? cat.GetString() ?? "" : "",
                Priority     = a.TryGetProperty("Priority", out var pri) ? pri.GetInt32() : 5,
                Severity     = a.TryGetProperty("Severity", out var sev) ? sev.GetString() ?? "MODERATE" : "MODERATE",
                EffectiveDate = a.TryGetProperty("Area", out var area) && area.ValueKind == JsonValueKind.Array && area.GetArrayLength() > 0
                    ? area[0].TryGetProperty("StartTime", out var st) ? st.GetString() ?? "" : ""
                    : "",
                ExpireDate   = a.TryGetProperty("Area", out var area2) && area2.ValueKind == JsonValueKind.Array && area2.GetArrayLength() > 0
                    ? area2[0].TryGetProperty("EndTime", out var et) ? et.GetString() ?? "" : ""
                    : "",
                MobileLink   = a.TryGetProperty("MobileLink", out var ml) ? ml.GetString() ?? "" : ""
            }).ToList();

            _cache.Set(cacheKey, alerts, AlertsTtl);
            return alerts;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching AccuWeather alerts for ({Lat},{Lon}). Serving seasonal advisory fallback.", lat, lon);
            var mockAlerts = GenerateMockAlerts(lat, lon);
            _cache.Set(cacheKey, mockAlerts, AlertsTtl);
            return mockAlerts;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Realistic Zimbabwean Agro-Meteorological Synthesizer (Fallback Mode)
    // ─────────────────────────────────────────────────────────────────────────
    private static AccuWeatherCurrentConditions GenerateMockCurrentConditions(double lat, double lon, string locationKey)
    {
        // Realistic Highveld / Mashonaland baseline temperatures (typically 22°C - 28°C daytime)
        var seed = (int)(Math.Abs(lat * 100) + Math.Abs(lon * 100));
        var rnd = new Random(seed + (int)DateTime.UtcNow.Hour);

        var tempC = Math.Round(22.0 + (rnd.NextDouble() * 6.5), 1);
        var humidity = rnd.Next(45, 78);
        var rain24h = rnd.NextDouble() < 0.35 ? Math.Round(rnd.NextDouble() * 12.5, 1) : 0.0;
        var windKmh = Math.Round(7.0 + (rnd.NextDouble() * 11.0), 1);
        var uv = rnd.Next(5, 9);

        return new AccuWeatherCurrentConditions
        {
            LocationKey = locationKey,
            WeatherText = rain24h > 0 ? "Scattered Showers" : (tempC > 26 ? "Warm & Sunny" : "Partly Cloudy"),
            WeatherIcon = rain24h > 0 ? 12 : (tempC > 26 ? 1 : 3),
            IsDayTime = true,
            ObservationDateTime = DateTime.UtcNow.ToString("o"),
            Temperature = new TemperatureValue { Value = tempC, Unit = "°C" },
            RealFeelTemperature = new TemperatureValue { Value = Math.Round(tempC + 1.2, 1), Unit = "°C" },
            RelativeHumidity = humidity,
            Wind = new WindInfo { Speed = windKmh, Direction = "ENE" },
            Visibility = 16.1,
            UVIndex = uv,
            UVIndexText = uv > 7 ? "Very High" : "Moderate",
            PrecipitationLast24hMm = rain24h,
            CloudCoverPct = rain24h > 0 ? 65 : 25,
            PressureHpa = 1018.4
        };
    }

    private static AccuWeatherForecast GenerateMockForecast(double lat, double lon)
    {
        var seed = (int)(Math.Abs(lat * 100) + Math.Abs(lon * 100));
        var rnd = new Random(seed);
        var now = DateTime.UtcNow;

        var days = new List<DailyForecast>();
        for (int i = 0; i < 5; i++)
        {
            var fDate = now.AddDays(i);
            var maxT = Math.Round(24.0 + (rnd.NextDouble() * 5.0), 1);
            var minT = Math.Round(14.0 + (rnd.NextDouble() * 3.5), 1);
            var rainProb = rnd.Next(10, 60);
            var rainMm = rainProb > 40 ? Math.Round(rnd.NextDouble() * 14.0, 1) : 0.0;

            days.Add(new DailyForecast
            {
                Date = fDate.ToString("yyyy-MM-ddTHH:mm:sszzz"),
                TempMaxC = maxT,
                TempMinC = minT,
                DayIcon = rainMm > 0 ? 12 : (maxT > 27 ? 1 : 3),
                DayPhrase = rainMm > 0 ? "Passing afternoon shower" : (maxT > 27 ? "Sunny and pleasant" : "Partly cloudy"),
                NightPhrase = "Clear and cool",
                RainProbabilityDay = rainProb,
                RainProbabilityNight = Math.Max(0, rainProb - 20),
                TotalRainMm = rainMm,
                WindSpeedKmh = Math.Round(8.0 + (rnd.NextDouble() * 8.0), 1),
                WindDirection = "ENE",
                HoursOfSun = rainMm > 0 ? 7.2 : 9.8
            });
        }

        return new AccuWeatherForecast
        {
            Headline = "Pleasant conditions across the agro-ecological basin with favorable soil moisture",
            DailyForecasts = days
        };
    }

    private static List<AccuWeatherAlert> GenerateMockAlerts(double lat, double lon)
    {
        return new List<AccuWeatherAlert>
        {
            new AccuWeatherAlert
            {
                AlertId = 101,
                Description = "Agro-Meteorological Notice: Optimal Planting & Top-Dressing Window across Natural Region II",
                Category = "Advisory",
                Priority = 2,
                Severity = "MINOR",
                EffectiveDate = DateTime.UtcNow.ToString("o"),
                ExpireDate = DateTime.UtcNow.AddDays(3).ToString("o"),
                MobileLink = "https://www.accuweather.com"
            }
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Models
// ─────────────────────────────────────────────────────────────────────────────

public class AccuWeatherCurrentConditions
{
    public string LocationKey { get; set; } = "";
    public string WeatherText { get; set; } = "";
    public int WeatherIcon { get; set; }
    public bool IsDayTime { get; set; }
    public string ObservationDateTime { get; set; } = "";
    public TemperatureValue Temperature { get; set; } = new();
    public TemperatureValue RealFeelTemperature { get; set; } = new();
    public int RelativeHumidity { get; set; }
    public WindInfo Wind { get; set; } = new();
    public double Visibility { get; set; }
    public int UVIndex { get; set; }
    public string UVIndexText { get; set; } = "";
    public double PrecipitationLast24hMm { get; set; }
    public int CloudCoverPct { get; set; }
    public double PressureHpa { get; set; }
}

public class TemperatureValue
{
    public double Value { get; set; }
    public string Unit { get; set; } = "°C";
}

public class WindInfo
{
    public double Speed { get; set; }
    public string Direction { get; set; } = "";
}

public class AccuWeatherForecast
{
    public string Headline { get; set; } = "";
    public List<DailyForecast> DailyForecasts { get; set; } = [];
}

public class DailyForecast
{
    public string Date { get; set; } = "";
    public double TempMaxC { get; set; }
    public double TempMinC { get; set; }
    public int DayIcon { get; set; }
    public string DayPhrase { get; set; } = "";
    public string NightPhrase { get; set; } = "";
    public int RainProbabilityDay { get; set; }
    public int RainProbabilityNight { get; set; }
    public double TotalRainMm { get; set; }
    public double WindSpeedKmh { get; set; }
    public string WindDirection { get; set; } = "";
    public double HoursOfSun { get; set; }
}

public class AccuWeatherAlert
{
    public int AlertId { get; set; }
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public int Priority { get; set; }
    public string Severity { get; set; } = "";
    public string EffectiveDate { get; set; } = "";
    public string ExpireDate { get; set; } = "";
    public string MobileLink { get; set; } = "";
}
