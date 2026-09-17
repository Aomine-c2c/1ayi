using Dapper;
using Ayis.Api.Data;
using Ayis.Api.Models;

namespace Ayis.Api.Repositories;

public class CropRepository
{
    private readonly IDbConnectionFactory _db;

    public CropRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Crop>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                name AS Name,
                scientific_name AS ScientificName,
                category AS Category,
                description AS Description,
                growing_days_min AS GrowingDaysMin,
                growing_days_max AS GrowingDaysMax,
                growing_days_typical AS GrowingDaysTypical,
                optimal_temp_min AS OptimalTempMin,
                optimal_temp_max AS OptimalTempMax,
                rainfall_min_mm AS RainfallMinMm,
                rainfall_optimum_mm AS RainfallOptimumMm,
                rainfall_max_mm AS RainfallMaxMm,
                expected_yield_min_kg_ha AS ExpectedYieldMinKgHa,
                expected_yield_max_kg_ha AS ExpectedYieldMaxKgHa,
                expected_yield_typical_kg_ha AS ExpectedYieldTypicalKgHa,
                frost_sensitive AS FrostSensitive,
                sunlight_hours_min AS SunlightHoursMin,
                suitable_months_json AS SuitableMonthsJson,
                planting_season AS PlantingSeason
            FROM crops
            WHERE is_active = 1
            ORDER BY name ASC;";

        return await conn.QueryAsync<Crop>(sql);
    }

    public async Task<Crop?> GetByIdAsync(string id)
    {
        using var conn = _db.CreateConnection();
        var sql = @"SELECT * FROM crops WHERE id = @Id LIMIT 1;";
        return await conn.QuerySingleOrDefaultAsync<Crop>(sql, new { Id = id });
    }

    public async Task<IEnumerable<CropCycle>> GetCyclesAsync(string? fieldId = null)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                field_id AS FieldId,
                crop_id AS CropId,
                variety_id AS VarietyId,
                season_name AS SeasonName,
                start_date AS StartDate,
                expected_harvest_date AS ExpectedHarvestDate,
                actual_harvest_date AS ActualHarvestDate,
                status AS Status,
                current_stage AS CurrentStage,
                target_yield_kg_ha AS TargetYieldKgHa,
                actual_yield_kg_ha AS ActualYieldKgHa,
                notes AS Notes
            FROM crop_cycles
            WHERE (@FieldId IS NULL OR field_id = @FieldId)
            ORDER BY start_date DESC;";
        return await conn.QueryAsync<CropCycle>(sql, new { FieldId = fieldId });
    }

    public async Task<IEnumerable<CropVariety>> GetVarietiesByCropIdAsync(string cropId)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                crop_id AS CropId,
                name AS Name,
                maturity_days AS MaturityDays,
                drought_tolerance AS DroughtTolerance,
                disease_resistance AS DiseaseResistance,
                yield_potential_kg_ha AS YieldPotentialKgHa,
                recommended_regions AS RecommendedRegions
            FROM crop_varieties
            WHERE crop_id = @CropId;";

        return await conn.QueryAsync<CropVariety>(sql, new { CropId = cropId });
    }
}
