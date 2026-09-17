using System.Text.Json.Serialization;

namespace Ayis.Api.Models;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "farmer"; // admin, agricultural_officer, farmer
    public bool IsActive { get; set; } = true;
    public bool IsStaff { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class FarmRegion
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string ClimateZone { get; set; } = string.Empty;
}

public class Farm
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    public string? RegionId { get; set; }
    public decimal SizeHa { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? BoundaryWkt { get; set; }
    public string? PrimaryCrop { get; set; }
    public string SoilType { get; set; } = "Loam";
    public string IrrigationType { get; set; } = "Rainfed";
    public decimal? ElevationM { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Field
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FarmId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal AreaHa { get; set; }
    public string BoundaryWkt { get; set; } = string.Empty;
    public decimal? SoilPh { get; set; }
    public decimal? OrganicMatterPct { get; set; }
    public string DrainageClass { get; set; } = "Well drained";
    public decimal? SlopePct { get; set; }
}

public class Crop
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string ScientificName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int GrowingDaysMin { get; set; }
    public int GrowingDaysMax { get; set; }
    public int GrowingDaysTypical { get; set; }
    public decimal OptimalTempMin { get; set; }
    public decimal OptimalTempMax { get; set; }
    public decimal RainfallMinMm { get; set; }
    public decimal RainfallOptimumMm { get; set; }
    public decimal RainfallMaxMm { get; set; }
    public decimal ExpectedYieldMinKgHa { get; set; }
    public decimal ExpectedYieldMaxKgHa { get; set; }
    public decimal ExpectedYieldTypicalKgHa { get; set; }
    public bool FrostSensitive { get; set; }
    public int SunlightHoursMin { get; set; }
    public string SuitableMonthsJson { get; set; } = "[]";
    public string? PlantingSeason { get; set; }
}

public class CropCycle
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FieldId { get; set; } = string.Empty;
    public string CropId { get; set; } = string.Empty;
    public string? VarietyId { get; set; }
    public string SeasonName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime ExpectedHarvestDate { get; set; }
    public DateTime? ActualHarvestDate { get; set; }
    public string Status { get; set; } = "PLANNED";
    public string CurrentStage { get; set; } = "Planting";
    public decimal? TargetYieldKgHa { get; set; }
    public decimal? ActualYieldKgHa { get; set; }
    public string? Notes { get; set; }
}

public class WeatherObservation
{
    public long Id { get; set; }
    public string StationId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public decimal TemperatureC { get; set; }
    public decimal? TempMinC { get; set; }
    public decimal? TempMaxC { get; set; }
    public decimal HumidityPct { get; set; }
    public decimal RainfallMm { get; set; }
    public decimal? WindSpeedKmh { get; set; }
    public decimal? SolarRadiationMj { get; set; }
}

public class SuitabilityAssessment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FieldId { get; set; } = string.Empty;
    public string CropId { get; set; } = string.Empty;
    public decimal SuitabilityScore { get; set; }
    public string SuitabilityClass { get; set; } = "MODERATELY_SUITABLE";
    public decimal TemperatureScore { get; set; }
    public decimal RainfallScore { get; set; }
    public decimal SoilScore { get; set; }
    public string? LimitingFactors { get; set; }
    public DateTime AssessedAt { get; set; } = DateTime.UtcNow;
}

public class YieldPrediction
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string CycleId { get; set; } = string.Empty;
    public decimal PredictedYieldKgHa { get; set; }
    public decimal ConfidenceLowerKgHa { get; set; }
    public decimal ConfidenceUpperKgHa { get; set; }
    public decimal ConfidenceScorePct { get; set; }
    public string? FactorsJson { get; set; }
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
}

public class Recommendation
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FieldId { get; set; } = string.Empty;
    public string Category { get; set; } = "IRRIGATION";
    public string Title { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string Urgency { get; set; } = "MEDIUM";
    public DateTime? ActionDueDate { get; set; }
    public bool IsImplemented { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class NotificationItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "INFO";
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AgronomicRule
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? CropId { get; set; }
    public string RuleType { get; set; } = "FERTILIZER_TIMING";
    public string Title { get; set; } = string.Empty;
    public string? GrowthStage { get; set; }
    public string TriggerCondition { get; set; } = string.Empty;
    public decimal? MinTempC { get; set; }
    public decimal? MaxTempC { get; set; }
    public decimal? MinRainfallMm { get; set; }
    public decimal? MaxRainfallMm { get; set; }
    public decimal? MinHumidityPct { get; set; }
    public decimal? MaxWindKmh { get; set; }
    public string ActionDirective { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public string Urgency { get; set; } = "MEDIUM";
    public bool IsActive { get; set; } = true;
    public string? AuthoredBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
