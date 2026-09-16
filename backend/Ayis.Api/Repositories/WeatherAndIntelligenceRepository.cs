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
}
