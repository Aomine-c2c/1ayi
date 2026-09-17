using Ayis.Api.Models;

namespace Ayis.Api.Services;

public class RecommendationEngineService
{
    public record CropSuitabilityResult(
        string CropId,
        string CropName,
        decimal SuitabilityScore,
        string SuitabilityClass,
        string RecommendationType,
        string Rationale,
        string RecommendedVarieties,
        List<string> RiskFactors,
        List<string> KeyOpportunities
    );

    public record InSeasonAdvisory(
        string Id,
        string Category,
        string Title,
        string ActionRequired,
        string Why,
        string Urgency,
        string DueTimeframe,
        string Crop,
        string Field,
        decimal ConfidenceScore,
        Dictionary<string, string> SupportingWeather
    );

    /// <summary>
    /// Scenario 1: Pre-Season Crop Selection & Planning
    /// Recommends best crops based on seasonal forecasts and soil conditions.
    /// </summary>
    public IEnumerable<CropSuitabilityResult> EvaluatePreSeasonCropSelection(
        decimal forecastRainfallMm,
        decimal forecastMeanTempC,
        decimal forecastHumidityPct,
        decimal soilPh,
        string soilType,
        string drainageClass)
    {
        var results = new List<CropSuitabilityResult>();

        // 1. Maize Evaluation
        var maizeScore = 80m;
        var maizeRisks = new List<string>();
        var maizeOpps = new List<string>();
        string maizeVariety = "H614D (Highland Hybrid)";

        if (forecastRainfallMm >= 500 && forecastRainfallMm <= 900 && forecastMeanTempC >= 18 && forecastMeanTempC <= 28)
        {
            maizeScore += 12;
            maizeOpps.Add("Hydrothermal index matches optimal grain filling requirements.");
        }
        else if (forecastRainfallMm < 450)
        {
            maizeScore -= 25;
            maizeRisks.Add("Seasonal precipitation deficit predicted; requires drought-tolerant variety.");
            maizeVariety = "DK8031 (Drought-Tolerant, 95 days)";
        }

        if (forecastHumidityPct > 75)
        {
            maizeRisks.Add("High seasonal humidity elevates risk of Grey Leaf Spot and Ear Rot.");
        }

        if (soilPh >= 5.8m && soilPh <= 7.0m)
        {
            maizeScore += 5;
            maizeOpps.Add("Soil pH within optimal nutrient assimilation band.");
        }
        else
        {
            maizeScore -= 10;
            maizeRisks.Add("Soil acidity or alkalinity outside optimal 5.8-7.0 band; requires liming.");
        }

        maizeScore = Math.Clamp(maizeScore, 10, 98);
        results.Add(new CropSuitabilityResult(
            "crop-001",
            "Maize (Zea mays)",
            maizeScore,
            GetClass(maizeScore),
            "Crop Selection",
            $"Seasonal forecast ({forecastRainfallMm}mm rain, {forecastMeanTempC}°C) provides {(maizeScore >= 80 ? "excellent" : "moderate")} conditions.",
            maizeVariety,
            maizeRisks,
            maizeOpps
        ));

        // 2. Dry Beans Evaluation
        var beanScore = 75m;
        var beanRisks = new List<string>();
        var beanOpps = new List<string>();
        string beanVariety = "Rosecoco GLP-2";

        if (forecastRainfallMm >= 350 && forecastRainfallMm <= 650 && forecastMeanTempC <= 26)
        {
            beanScore += 15;
            beanOpps.Add("Precipitation aligns well with short legume taproot profile.");
        }
        else if (forecastRainfallMm > 800)
        {
            beanScore -= 30;
            beanRisks.Add("Excessive precipitation promotes root rot, damping off, and flower drop.");
        }

        if (forecastHumidityPct > 80)
        {
            beanRisks.Add("Anthracnose epidemic risk elevated under continuous damp conditions.");
        }

        beanScore = Math.Clamp(beanScore, 10, 95);
        results.Add(new CropSuitabilityResult(
            "crop-003",
            "Dry Beans (Phaseolus vulgaris)",
            beanScore,
            GetClass(beanScore),
            "Crop Selection",
            $"Legume cycle well-suited for intercropping or short seasonal windows under {forecastRainfallMm}mm rainfall.",
            beanVariety,
            beanRisks,
            beanOpps
        ));

        // 3. Wheat Evaluation
        var wheatScore = 70m;
        var wheatRisks = new List<string>();
        var wheatOpps = new List<string>();

        if (forecastMeanTempC <= 22 && forecastRainfallMm >= 400 && forecastRainfallMm <= 700)
        {
            wheatScore += 20;
            wheatOpps.Add("Cool highland climate supports strong tillering and grain hardening.");
        }
        else if (forecastMeanTempC > 25)
        {
            wheatScore -= 35;
            wheatRisks.Add("Thermal threshold exceeded; high temperatures impede flowering and induce sterility.");
        }

        wheatScore = Math.Clamp(wheatScore, 10, 95);
        results.Add(new CropSuitabilityResult(
            "crop-002",
            "Wheat (Triticum aestivum)",
            wheatScore,
            GetClass(wheatScore),
            "Crop Selection",
            $"Highland cereal recommendation adapted for well-drained loams with moderate moisture.",
            "Kenya Tayari / Robin",
            wheatRisks,
            wheatOpps
        ));

        // 4. Irish Potato Evaluation
        var potatoScore = 72m;
        var potatoRisks = new List<string>();
        var potatoOpps = new List<string>();

        if (forecastMeanTempC <= 20 && forecastRainfallMm >= 500 && forecastRainfallMm <= 800)
        {
            potatoScore += 18;
            potatoOpps.Add("Ideal cool night temperatures for tuber induction.");
        }
        if (forecastHumidityPct > 85)
        {
            potatoRisks.Add("Late Blight (Phytophthora infestans) alert: Prophylactic fungicide spraying required.");
        }

        potatoScore = Math.Clamp(potatoScore, 10, 96);
        results.Add(new CropSuitabilityResult(
            "crop-004",
            "Irish Potato (Solanum tuberosum)",
            potatoScore,
            GetClass(potatoScore),
            "Crop Selection",
            "Cool-season highland tuber yielding high caloric return under loose friable soils.",
            "Shangi Certified / Dutch Robijn",
            potatoRisks,
            potatoOpps
        ));

        return results.OrderByDescending(r => r.SuitabilityScore);
    }

    /// <summary>
    /// Scenario 2: In-Season Daily Operational Advisory
    /// Analyzes live weather observations + 5-day forecasts + crop growth stage to trigger daily farming instructions.
    /// </summary>
    public IEnumerable<InSeasonAdvisory> EvaluateInSeasonDirectives(
        decimal currentTempC,
        decimal currentHumidityPct,
        decimal currentWindSpeedKmh,
        decimal rainLast24hMm,
        decimal forecastRainNext48hMm,
        string cropName,
        string currentStage,
        string fieldName)
    {
        var list = new List<InSeasonAdvisory>();

        // 1. Spray Window Directive (Weather + Pest/Disease Risk)
        if (currentWindSpeedKmh < 9.0m && forecastRainNext48hMm < 5.0m)
        {
            list.Add(new InSeasonAdvisory(
                Guid.NewGuid().ToString(),
                "SPRAYING",
                "Optimal Crop Spraying Window Open",
                "Execute planned fungicide or herbicide spraying before 10:30 AM while wind speed remains low.",
                $"Sustained wind speed ({currentWindSpeedKmh} km/h) is below the 9.0 km/h drift safety limit, and no rain is predicted to wash off applications.",
                "HIGH",
                "Next 24 Hours",
                cropName,
                fieldName,
                94m,
                new Dictionary<string, string>
                {
                    ["WindSpeed"] = $"{currentWindSpeedKmh} km/h (Calm)",
                    ["RainForecast"] = $"{forecastRainNext48hMm} mm (Dry)",
                    ["AirTemp"] = $"{currentTempC}°C"
                }
            ));
        }
        else if (currentWindSpeedKmh >= 12.0m)
        {
            list.Add(new InSeasonAdvisory(
                Guid.NewGuid().ToString(),
                "SPRAYING",
                "Advisory: Postpone Chemical Spraying",
                "Do not spray foliar chemicals today. High wind velocity will cause off-target drift and waste inputs.",
                $"Wind velocity at {currentWindSpeedKmh} km/h exceeds maximum safe application threshold.",
                "MEDIUM",
                "Immediate",
                cropName,
                fieldName,
                89m,
                new Dictionary<string, string>
                {
                    ["WindSpeed"] = $"{currentWindSpeedKmh} km/h (Hazardous Drift)",
                    ["Threshold"] = "Max 9 km/h"
                }
            ));
        }

        // 2. Fertilizer Top-Dressing Directive (Crop Stage + Rainfall Trigger)
        if (currentStage.Contains("Vegetative", StringComparison.OrdinalIgnoreCase) || currentStage.Contains("V6", StringComparison.OrdinalIgnoreCase))
        {
            if (forecastRainNext48hMm >= 8.0m && forecastRainNext48hMm <= 30.0m)
            {
                list.Add(new InSeasonAdvisory(
                    Guid.NewGuid().ToString(),
                    "FERTILIZER",
                    "Top-Dress Nitrogen (CAN) Before Upcoming Showers",
                    "Apply Calcium Ammonium Nitrate (CAN) at 50 kg/acre 5cm from plant bases within the next 48 hours.",
                    $"Field is in rapid vegetative growth ({currentStage}). Forecasted rain ({forecastRainNext48hMm} mm) will dissolve and incorporate nitrogen into root zones without leaching.",
                    "HIGH",
                    "Within 48 Hours",
                    cropName,
                    fieldName,
                    96m,
                    new Dictionary<string, string>
                    {
                        ["CropStage"] = currentStage,
                        ["ForecastRain"] = $"{forecastRainNext48hMm} mm expected",
                        ["SoilMoisture"] = $"{rainLast24hMm} mm in past 24h"
                    }
                ));
            }
        }

        // 3. Fungal Disease Risk Warning (Humidity + Temp Trigger)
        if (currentHumidityPct >= 72.0m && currentTempC >= 15.0m && currentTempC <= 23.0m)
        {
            list.Add(new InSeasonAdvisory(
                Guid.NewGuid().ToString(),
                "PEST_DISEASE",
                "High Fungal Blight / Rust Inoculum Alert",
                "Inspect lower leaves and canopy for fungal sporulation; prepare preventive broad-spectrum fungicide.",
                $"Sustained air humidity ({currentHumidityPct}%) combined with mild temperatures ({currentTempC}°C) creates ideal microclimatic conditions for fungal germination.",
                "CRITICAL",
                "Immediate / Today",
                cropName,
                fieldName,
                91m,
                new Dictionary<string, string>
                {
                    ["Humidity"] = $"{currentHumidityPct}% (Elevated)",
                    ["Temperature"] = $"{currentTempC}°C (Optimal for Pathogen)",
                    ["PathogenRisk"] = "Yellow Rust / Early Blight"
                }
            ));
        }

        // 4. Irrigation Directive (Flowering Stage + Moisture Deficit)
        if (currentStage.Contains("Flowering", StringComparison.OrdinalIgnoreCase) || currentStage.Contains("R1", StringComparison.OrdinalIgnoreCase))
        {
            if (rainLast24hMm < 2.0m && forecastRainNext48hMm < 5.0m)
            {
                list.Add(new InSeasonAdvisory(
                    Guid.NewGuid().ToString(),
                    "IRRIGATION",
                    "Supplemental Irrigation Required: Flowering Moisture Stress",
                    "Schedule 15mm supplemental drip or furrow irrigation to protect flowers from thermal abortion.",
                    $"Crop is at sensitive flowering stage ({currentStage}) with insufficient soil moisture (<2mm in 24h) and negligible rain in the 48h forecast.",
                    "HIGH",
                    "Tomorrow Morning",
                    cropName,
                    fieldName,
                    93m,
                    new Dictionary<string, string>
                    {
                        ["CropStage"] = currentStage,
                        ["RecentRain"] = $"{rainLast24hMm} mm",
                        ["ForecastRain"] = $"{forecastRainNext48hMm} mm"
                    }
                ));
            }
        }

        return list;
    }

    private static string GetClass(decimal score) => score switch
    {
        >= 85 => "HIGHLY_SUITABLE",
        >= 70 => "MODERATELY_SUITABLE",
        >= 50 => "MARGINALLY_SUITABLE",
        _ => "NOT_SUITABLE"
    };
}
