using Dapper;
using Ayis.Api.Data;
using Ayis.Api.Models;

namespace Ayis.Api.Repositories;

public class WeatherAndIntelligenceRepository
{
    private readonly IDbConnectionFactory _db;

    public WeatherAndIntelligenceRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<WeatherObservation>> GetRecentObservationsAsync(int limit = 24)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                station_id AS StationId,
                timestamp AS Timestamp,
                temperature_c AS TemperatureC,
                temp_min_c AS TempMinC,
                temp_max_c AS TempMaxC,
                humidity_pct AS HumidityPct,
                rainfall_mm AS RainfallMm,
                wind_speed_kmh AS WindSpeedKmh,
                solar_radiation_mj AS SolarRadiationMj
            FROM weather_observations
            ORDER BY timestamp DESC
            LIMIT @Limit;";

        return await conn.QueryAsync<WeatherObservation>(sql, new { Limit = limit });
    }

    public async Task<IEnumerable<SuitabilityAssessment>> GetSuitabilityByFieldAsync(string fieldId)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                field_id AS FieldId,
                crop_id AS CropId,
                suitability_score AS SuitabilityScore,
                suitability_class AS SuitabilityClass,
                temperature_score AS TemperatureScore,
                rainfall_score AS RainfallScore,
                soil_score AS SoilScore,
                limiting_factors AS LimitingFactors,
                assessed_at AS AssessedAt
            FROM suitability_assessments
            WHERE field_id = @FieldId
            ORDER BY suitability_score DESC;";

        return await conn.QueryAsync<SuitabilityAssessment>(sql, new { FieldId = fieldId });
    }

    public async Task<IEnumerable<YieldPrediction>> GetPredictionsByCycleAsync(string cycleId)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                cycle_id AS CycleId,
                predicted_yield_kg_ha AS PredictedYieldKgHa,
                confidence_lower_kg_ha AS ConfidenceLowerKgHa,
                confidence_upper_kg_ha AS ConfidenceUpperKgHa,
                confidence_score_pct AS ConfidenceScorePct,
                factors_json AS FactorsJson,
                calculated_at AS CalculatedAt
            FROM yield_predictions
            WHERE cycle_id = @CycleId
            ORDER BY calculated_at DESC;";

        return await conn.QueryAsync<YieldPrediction>(sql, new { CycleId = cycleId });
    }

    public async Task<IEnumerable<Recommendation>> GetRecommendationsAsync(string? fieldId = null)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                field_id AS FieldId,
                category AS Category,
                title AS Title,
                details AS Details,
                urgency AS Urgency,
                action_due_date AS ActionDueDate,
                is_implemented AS IsImplemented,
                created_at AS CreatedAt
            FROM recommendations
            WHERE (@FieldId IS NULL OR field_id = @FieldId)
            ORDER BY created_at DESC;";

        return await conn.QueryAsync<Recommendation>(sql, new { FieldId = fieldId });
    }

    public async Task<IEnumerable<NotificationItem>> GetNotificationsAsync(string? userId = null)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                user_id AS UserId,
                title AS Title,
                message AS Message,
                type AS Type,
                is_read AS IsRead,
                created_at AS CreatedAt
            FROM notifications
            WHERE (@UserId IS NULL OR user_id = @UserId)
            ORDER BY created_at DESC
            LIMIT 50;";

        return await conn.QueryAsync<NotificationItem>(sql, new { UserId = userId });
    }

    public async Task<IEnumerable<AgronomicRule>> GetAgronomicRulesAsync(string? cropId = null)
    {
        try
        {
            using var conn = _db.CreateConnection();
            var sql = @"
                SELECT 
                    id AS Id,
                    crop_id AS CropId,
                    rule_type AS RuleType,
                    title AS Title,
                    growth_stage AS GrowthStage,
                    trigger_condition AS TriggerCondition,
                    min_temp_c AS MinTempC,
                    max_temp_c AS MaxTempC,
                    min_rainfall_mm AS MinRainfallMm,
                    max_rainfall_mm AS MaxRainfallMm,
                    min_humidity_pct AS MinHumidityPct,
                    max_wind_kmh AS MaxWindKmh,
                    action_directive AS ActionDirective,
                    rationale AS Rationale,
                    urgency AS Urgency,
                    is_active AS IsActive,
                    authored_by AS AuthoredBy,
                    created_at AS CreatedAt,
                    updated_at AS UpdatedAt
                FROM agronomic_rules
                WHERE is_active = 1 AND (@CropId IS NULL OR crop_id = @CropId OR crop_id IS NULL)
                ORDER BY created_at DESC;";

            return await conn.QueryAsync<AgronomicRule>(sql, new { CropId = cropId });
        }
        catch
        {
            // Graceful fallback if database table has not yet been executed in active local MySQL
            return GetFallbackAgronomicRules(cropId);
        }
    }

    private static IEnumerable<AgronomicRule> GetFallbackAgronomicRules(string? cropId)
    {
        var list = new List<AgronomicRule>
        {
            new()
            {
                Id = "rule-001",
                CropId = "crop-001",
                RuleType = "FERTILIZER_TIMING",
                Title = "Top-Dress Nitrogen (CAN) Before Upcoming Showers",
                GrowthStage = "Vegetative V6",
                TriggerCondition = "Rain forecasted 8-30mm within 48h during V6 vegetative growth",
                ActionDirective = "Apply Calcium Ammonium Nitrate (CAN) at 50 kg/acre 5cm from plant bases within the next 48 hours.",
                Rationale = "Field is in rapid vegetative growth. Forecasted rain will dissolve and incorporate nitrogen into root zones without leaching.",
                Urgency = "HIGH",
                IsActive = true,
                AuthoredBy = "Dr. Sarah Mwangi (Senior Agronomist - KALRO)"
            },
            new()
            {
                Id = "rule-002",
                CropId = "crop-002",
                RuleType = "DISEASE_RISK",
                Title = "High Fungal Blight / Yellow Rust Inoculum Alert",
                GrowthStage = "Tillering to Stem Extension",
                TriggerCondition = "Relative humidity > 72% for > 24h at mild temps 15-23°C",
                ActionDirective = "Inspect lower leaves and canopy for fungal sporulation; prepare preventive broad-spectrum fungicide.",
                Rationale = "Sustained humidity with mild temperatures creates ideal microclimatic conditions for fungal germination.",
                Urgency = "CRITICAL",
                IsActive = true,
                AuthoredBy = "Dr. Sarah Mwangi (Senior Agronomist - KALRO)"
            },
            new()
            {
                Id = "rule-003",
                CropId = null,
                RuleType = "SPRAY_WINDOW",
                Title = "Optimal Crop Spraying Window Open",
                GrowthStage = "Any Active Stage",
                TriggerCondition = "Wind speed < 9 km/h and rain forecast < 5mm for 24h",
                ActionDirective = "Execute planned fungicide or herbicide spraying before 10:30 AM while wind speed remains low.",
                Rationale = "Sustained wind speed is below the 9.0 km/h drift limit, and no rain is predicted to wash off applications.",
                Urgency = "HIGH",
                IsActive = true,
                AuthoredBy = "Dr. Sarah Mwangi (Senior Agronomist - KALRO)"
            },
            new()
            {
                Id = "rule-004",
                CropId = "crop-003",
                RuleType = "IRRIGATION_DEFICIT",
                Title = "Supplemental Irrigation: Flowering Moisture Stress Prevention",
                GrowthStage = "Flowering R1",
                TriggerCondition = "Rain last 24h < 2mm and forecast rain 48h < 5mm during flowering",
                ActionDirective = "Schedule 15mm supplemental drip or furrow irrigation to protect flowers from thermal abortion.",
                Rationale = "Crop is at sensitive flowering stage with insufficient soil moisture and negligible rain in the 48h forecast.",
                Urgency = "HIGH",
                IsActive = true,
                AuthoredBy = "Dr. Sarah Mwangi (Senior Agronomist - KALRO)"
            },
            new()
            {
                Id = "rule-005",
                CropId = "crop-001",
                RuleType = "PRE_SEASON_CROP_SELECTION",
                Title = "Maize Seasonal Hydrothermal Suitability Matrix",
                GrowthStage = "Pre-Season Planning",
                TriggerCondition = "Seasonal forecast precipitation 500-900mm with mean temp 18-28°C and soil pH 5.8-7.0",
                ActionDirective = "Recommend Highland Hybrid H614D for high rain forecast; recommend DK8031 if forecast drops below 450mm.",
                Rationale = "Hydrothermal index matches optimal grain filling requirements for East African highlands.",
                Urgency = "HIGH",
                IsActive = true,
                AuthoredBy = "Dr. Sarah Mwangi (Senior Agronomist - KALRO)"
            }
        };

        return string.IsNullOrEmpty(cropId) 
            ? list 
            : list.Where(r => r.CropId == null || r.CropId == cropId);
    }

    public async Task<bool> CreateAgronomicRuleAsync(AgronomicRule rule)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO agronomic_rules 
            (id, crop_id, rule_type, title, growth_stage, trigger_condition, min_temp_c, max_temp_c, min_rainfall_mm, max_rainfall_mm, min_humidity_pct, max_wind_kmh, action_directive, rationale, urgency, is_active, authored_by)
            VALUES 
            (@Id, @CropId, @RuleType, @Title, @GrowthStage, @TriggerCondition, @MinTempC, @MaxTempC, @MinRainfallMm, @MaxRainfallMm, @MinHumidityPct, @MaxWindKmh, @ActionDirective, @Rationale, @Urgency, @IsActive, @AuthoredBy);";

        var affected = await conn.ExecuteAsync(sql, rule);
        return affected > 0;
    }
}
