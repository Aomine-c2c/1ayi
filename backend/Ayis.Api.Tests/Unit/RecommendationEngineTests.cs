using FluentAssertions;
using Ayis.Api.Services;

namespace Ayis.Api.Tests.Unit;

/// <summary>
/// Unit tests for the RecommendationEngineService — no DB required.
/// </summary>
public class RecommendationEngineServiceTests
{
    private readonly RecommendationEngineService _sut = new();

    // ── Pre-Season Crop Selection ─────────────────────────────────────────────

    [Fact]
    public void EvaluatePreSeasonCropSelection_ReturnsMultipleCrops_ForTypicalInputs()
    {
        var results = _sut.EvaluatePreSeasonCropSelection(
            forecastRainfallMm  : 680m,
            forecastMeanTempC   : 21.5m,
            forecastHumidityPct : 65m,
            soilPh              : 6.4m,
            soilType            : "Volcanic Loam",
            drainageClass       : "Well drained"
        ).ToList();

        results.Should().NotBeEmpty();
        results.Should().HaveCountGreaterThan(1, "the engine evaluates multiple crops");
    }

    [Fact]
    public void EvaluatePreSeasonCropSelection_MaizeScoreReduced_ForLowRainfall()
    {
        // Very low rainfall should push maize score down
        var highRainResults = _sut.EvaluatePreSeasonCropSelection(700m, 22m, 60m, 6.5m, "Loam", "Well drained").ToList();
        var lowRainResults  = _sut.EvaluatePreSeasonCropSelection(300m, 22m, 60m, 6.5m, "Loam", "Well drained").ToList();

        var maizeHigh = highRainResults.FirstOrDefault(r => r.CropName.Contains("Maize"));
        var maizeLow  = lowRainResults.FirstOrDefault( r => r.CropName.Contains("Maize"));

        maizeHigh.Should().NotBeNull();
        maizeLow.Should().NotBeNull();
        maizeLow!.SuitabilityScore.Should().BeLessThan(maizeHigh!.SuitabilityScore);
    }

    [Fact]
    public void EvaluatePreSeasonCropSelection_AllScoresInValidRange()
    {
        var results = _sut.EvaluatePreSeasonCropSelection(600m, 20m, 65m, 6.0m, "Clay Loam", "Moderately drained").ToList();

        foreach (var result in results)
        {
            result.SuitabilityScore.Should().BeInRange(0m, 100m,
                $"score for {result.CropName} must be clamped between 0 and 100");
        }
    }

    [Fact]
    public void EvaluatePreSeasonCropSelection_SuitabilityClassNotEmpty()
    {
        var results = _sut.EvaluatePreSeasonCropSelection(700m, 21m, 65m, 6.5m, "Loam", "Well drained").ToList();

        foreach (var r in results)
        {
            r.SuitabilityClass.Should().NotBeNullOrWhiteSpace();
            r.RecommendedVarieties.Should().NotBeNullOrWhiteSpace();
        }
    }

    // ── In-Season Daily Directives ────────────────────────────────────────────

    [Fact]
    public void EvaluateInSeasonDirectives_ReturnsAtLeastOneDirective_ForTypicalConditions()
    {
        var results = _sut.EvaluateInSeasonDirectives(
            tempC              : 22.4m,
            humidityPct        : 68m,
            windSpeedKmh       : 6.2m,
            rain24hMm          : 18.2m,
            forecastRain48hMm  : 14.0m,
            crop               : "Highland Hybrid Maize (H614D)",
            growthStage        : "Vegetative V6",
            fieldName          : "North Field A"
        ).ToList();

        results.Should().NotBeEmpty();
    }

    [Fact]
    public void EvaluateInSeasonDirectives_AllDirectivesHaveRequiredFields()
    {
        var results = _sut.EvaluateInSeasonDirectives(25m, 70m, 5m, 0m, 2m, "Maize", "Flowering R1", "Field A").ToList();

        foreach (var directive in results)
        {
            directive.Category.Should().NotBeNullOrWhiteSpace();
            directive.Title.Should().NotBeNullOrWhiteSpace();
            directive.ActionRequired.Should().NotBeNullOrWhiteSpace();
            directive.ConfidenceScore.Should().BeInRange(0m, 1m);
        }
    }

    [Fact]
    public void EvaluateInSeasonDirectives_HighHumidity_TriggersDiseasRiskDirective()
    {
        // Very high humidity with mild temps should flag disease risk
        var results = _sut.EvaluateInSeasonDirectives(
            tempC: 18m, humidityPct: 85m, windSpeedKmh: 4m,
            rain24hMm: 2m, forecastRain48hMm: 0m,
            crop: "Wheat", growthStage: "Tillering", fieldName: "Test Field"
        ).ToList();

        results.Should().Contain(d =>
            d.Category.Contains("DISEASE", StringComparison.OrdinalIgnoreCase) ||
            d.Title.Contains("disease", StringComparison.OrdinalIgnoreCase) ||
            d.Title.Contains("fungal", StringComparison.OrdinalIgnoreCase),
            "high humidity + mild temps should produce a disease risk directive");
    }
}
