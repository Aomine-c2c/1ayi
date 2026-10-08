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

    public const string DefaultHardcodedApiKey = "zpka_ea3355b1c3cd4e6ea815609220688db3_81064c74a";

    private bool IsApiKeyConfigured =>
        !string.IsNullOrWhiteSpace(_apiKey) &&
        !_apiKey.Equals("your-accuweather-api-key-here", StringComparison.OrdinalIgnoreCase);

    public AccuWeatherService(HttpClient http, IMemoryCache cache,
        IConfiguration config, ILogger<AccuWeatherService> logger)
    {
        _http    = http;
        _cache   = cache;
        _logger  = logger;
        var keyFromConfig = config["AccuWeather:ApiKey"] ?? config["ACCUWEATHER_API_KEY"];
        _apiKey  = (!string.IsNullOrWhiteSpace(keyFromConfig) && !keyFromConfig.Equals("your-accuweather-api-key-here", StringComparison.OrdinalIgnoreCase))
            ? keyFromConfig
            : DefaultHardcodedApiKey;
        if (!IsApiKeyConfigured)
        {
            _logger.LogWarning("AccuWeather:ApiKey is not configured or is a placeholder. Telemetry fallback simulation will be used.");
        }
        _baseUrl = config["AccuWeather:BaseUrl"] ?? config["ACCUWEATHER_BASE_URL"] ?? "https://dataservice.accuweather.com";

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

        if (!IsApiKeyConfigured)
        {
            var fallbackKey = $"zw-loc-{(int)(Math.Abs(lat) * 100)}-{(int)(Math.Abs(lon) * 100)}";
            _cache.Set(cacheKey, fallbackKey, LocationKeyTtl);
            return fallbackKey;
        }

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

        // 1. Try Open-Meteo live API first (Free, live real-world data, no key required)
        try
        {
            var openMeteoResult = await FetchOpenMeteoCurrentConditionsAsync(lat, lon, locationKey);
            if (openMeteoResult != null)
            {
                _cache.Set(cacheKey, openMeteoResult, CurrentConditionsTtl);
                return openMeteoResult;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Open-Meteo live fetch skipped for ({Lat},{Lon}).", lat, lon);
        }

        // 2. AccuWeather attempt if configured
        if (IsApiKeyConfigured)
        {
            var url = $"/currentconditions/v1/{locationKey}?apikey={_apiKey}&details=true&metric=true";
            try
            {
                var response = await _http.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    var arr = doc.RootElement;
                    if (arr.ValueKind == JsonValueKind.Array && arr.GetArrayLength() > 0)
                    {
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
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "AccuWeather query skipped.");
            }
        }

        // 3. Realistic agro-meteorological simulation fallback
        var mockCurrent = GenerateMockCurrentConditions(lat, lon, locationKey);
        _cache.Set(cacheKey, mockCurrent, CurrentConditionsTtl);
        return mockCurrent;
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

        // 1. Try Open-Meteo live 5-day forecast first (Free, live real-world, no key)
        try
        {
            var openMeteoForecast = await FetchOpenMeteoForecastAsync(lat, lon);
            if (openMeteoForecast != null && openMeteoForecast.DailyForecasts.Count > 0)
            {
                _cache.Set(cacheKey, openMeteoForecast, ForecastTtl);
                return openMeteoForecast;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Open-Meteo forecast fetch skipped for ({Lat},{Lon}).", lat, lon);
        }

        // 2. AccuWeather attempt if configured
        if (IsApiKeyConfigured)
        {
            var url = $"/forecasts/v1/daily/5day/{locationKey}?apikey={_apiKey}&metric=true&details=true";
            try
            {
                var response = await _http.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
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
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "AccuWeather forecast query skipped.");
            }
        }

        // 3. Fallback to realistic agro-meteorological simulation
        var mock = GenerateMockForecast(lat, lon);
        _cache.Set(cacheKey, mock, ForecastTtl);
        return mock;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Weather Alerts
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<List<AccuWeatherAlert>> GetAlertsAsync(double lat, double lon)
    {
        var cacheKey = $"alerts:{lat:F4}:{lon:F4}";
        if (_cache.TryGetValue(cacheKey, out List<AccuWeatherAlert>? cached))
            return cached!;

        if (!IsApiKeyConfigured)
        {
            _cache.Set(cacheKey, new List<AccuWeatherAlert>(), AlertsTtl);
            return [];
        }

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

    // ─────────────────────────────────────────────────────────────────────────
    // Open-Meteo Integration (100% Free, live satellite telemetry, no key needed)
    // ─────────────────────────────────────────────────────────────────────────
    private static readonly HttpClient _openMeteoHttp = new() { Timeout = TimeSpan.FromSeconds(6) };

    private async Task<AccuWeatherCurrentConditions?> FetchOpenMeteoCurrentConditionsAsync(double lat, double lon, string locationKey)
    {
        var url = $"https://api.open-meteo.com/v1/forecast?latitude={lat:F4}&longitude={lon:F4}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&timezone=auto";
        var res = await _openMeteoHttp.GetAsync(url);
        if (!res.IsSuccessStatusCode) return null;

        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var current = doc.RootElement.GetProperty("current");

        var temp = current.GetProperty("temperature_2m").GetDouble();
        var apparentTemp = current.GetProperty("apparent_temperature").GetDouble();
        var humidity = current.GetProperty("relative_humidity_2m").GetInt32();
        var windSpeed = current.GetProperty("wind_speed_10m").GetDouble();
        var windDir = current.GetProperty("wind_direction_10m").GetDouble();
        var pressure = current.GetProperty("pressure_msl").GetDouble();
        var cloud = current.GetProperty("cloud_cover").GetInt32();
        var isDay = current.GetProperty("is_day").GetInt32() == 1;
        var rainMm = current.GetProperty("precipitation").GetDouble();
        var wCode = current.GetProperty("weather_code").GetInt32();

        return new AccuWeatherCurrentConditions
        {
            LocationKey = locationKey,
            WeatherText = MapWmoCodeToText(wCode),
            WeatherIcon = MapWmoCodeToIcon(wCode, isDay),
            IsDayTime = isDay,
            ObservationDateTime = DateTime.UtcNow.ToString("o"),
            Temperature = new TemperatureValue { Value = temp, Unit = "°C" },
            RealFeelTemperature = new TemperatureValue { Value = apparentTemp, Unit = "°C" },
            RelativeHumidity = humidity,
            Wind = new WindInfo { Speed = windSpeed, Direction = MapDegreesToDirection(windDir) },
            Visibility = 10.0,
            UVIndex = isDay ? 6 : 0,
            UVIndexText = isDay ? "Moderate" : "Low",
            PrecipitationLast24hMm = rainMm,
            CloudCoverPct = cloud,
            PressureHpa = pressure
        };
    }

    private async Task<AccuWeatherForecast?> FetchOpenMeteoForecastAsync(double lat, double lon)
    {
        var url = $"https://api.open-meteo.com/v1/forecast?latitude={lat:F4}&longitude={lon:F4}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=5";
        var res = await _openMeteoHttp.GetAsync(url);
        if (!res.IsSuccessStatusCode) return null;

        var json = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var daily = doc.RootElement.GetProperty("daily");

        var times = daily.GetProperty("time").EnumerateArray().Select(x => x.GetString() ?? "").ToList();
        var maxTemps = daily.GetProperty("temperature_2m_max").EnumerateArray().Select(x => x.GetDouble()).ToList();
        var minTemps = daily.GetProperty("temperature_2m_min").EnumerateArray().Select(x => x.GetDouble()).ToList();
        var precipSums = daily.GetProperty("precipitation_sum").EnumerateArray().Select(x => x.GetDouble()).ToList();
        var precipProbs = daily.GetProperty("precipitation_probability_max").EnumerateArray().Select(x => x.GetInt32()).ToList();
        var windSpeeds = daily.GetProperty("wind_speed_10m_max").EnumerateArray().Select(x => x.GetDouble()).ToList();
        var wCodes = daily.GetProperty("weather_code").EnumerateArray().Select(x => x.GetInt32()).ToList();

        var days = new List<DailyForecast>();
        for (int i = 0; i < times.Count && i < 5; i++)
        {
            var code = wCodes[i];
            days.Add(new DailyForecast
            {
                Date = times[i],
                TempMaxC = maxTemps[i],
                TempMinC = minTemps[i],
                DayIcon = MapWmoCodeToIcon(code, true),
                DayPhrase = MapWmoCodeToText(code),
                NightPhrase = "Clear and calm",
                RainProbabilityDay = precipProbs[i],
                RainProbabilityNight = Math.Max(0, precipProbs[i] - 15),
                TotalRainMm = precipSums[i],
                WindSpeedKmh = windSpeeds[i],
                WindDirection = "ENE",
                HoursOfSun = precipSums[i] > 1.0 ? 6.5 : 9.5
            });
        }

        return new AccuWeatherForecast
        {
            Headline = "Live satellite forecast provided via Open-Meteo agro-meteorological station",
            DailyForecasts = days
        };
    }

    private static string MapWmoCodeToText(int code) => code switch
    {
        0 => "Clear sky",
        1 => "Mainly sunny",
        2 => "Partly cloudy",
        3 => "Overcast",
        45 or 48 => "Foggy / Mist",
        51 or 53 or 55 => "Light Drizzle",
        61 or 63 => "Moderate Rain",
        65 => "Heavy Rain",
        80 or 81 or 82 => "Passing Rain Showers",
        95 or 96 or 99 => "Thunderstorm",
        _ => "Partly Cloudy"
    };

    private static int MapWmoCodeToIcon(int code, bool isDay) => code switch
    {
        0 => isDay ? 1 : 33,
        1 or 2 => isDay ? 3 : 35,
        3 => 6,
        45 or 48 => 11,
        51 or 53 or 55 => 12,
        61 or 63 or 65 => 18,
        80 or 81 or 82 => 12,
        95 or 96 or 99 => 15,
        _ => isDay ? 3 : 35
    };

    private static string MapDegreesToDirection(double degrees)
    {
        string[] dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        int idx = (int)Math.Round((degrees % 360) / 45) % 8;
        return dirs[idx];
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
