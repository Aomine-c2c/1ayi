using Dapper;
using Ayis.Api.Data;
using Ayis.Api.Models;

namespace Ayis.Api.Repositories;

public class FarmRepository
{
    private readonly IDbConnectionFactory _db;

    public FarmRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Farm>> GetAllAsync(string? ownerId = null)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                name AS Name,
                owner_id AS OwnerId,
                region_id AS RegionId,
                size_ha AS SizeHa,
                ST_Y(location) AS Latitude,
                ST_X(location) AS Longitude,
                ST_AsText(boundary) AS BoundaryWkt,
                primary_crop AS PrimaryCrop,
                soil_type AS SoilType,
                irrigation_type AS IrrigationType,
                elevation_m AS ElevationM,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM farms
            WHERE (@OwnerId IS NULL OR owner_id = @OwnerId) AND is_active = 1
            ORDER BY created_at DESC;";

        return await conn.QueryAsync<Farm>(sql, new { OwnerId = ownerId });
    }

    public async Task<Farm?> GetByIdAsync(string id)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                name AS Name,
                owner_id AS OwnerId,
                region_id AS RegionId,
                size_ha AS SizeHa,
                ST_Y(location) AS Latitude,
                ST_X(location) AS Longitude,
                ST_AsText(boundary) AS BoundaryWkt,
                primary_crop AS PrimaryCrop,
                soil_type AS SoilType,
                irrigation_type AS IrrigationType,
                elevation_m AS ElevationM,
                is_active AS IsActive,
                created_at AS CreatedAt
            FROM farms
            WHERE id = @Id LIMIT 1;";

        return await conn.QuerySingleOrDefaultAsync<Farm>(sql, new { Id = id });
    }

    public async Task<int> CreateAsync(Farm farm)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO farms (
                id, name, owner_id, region_id, size_ha, 
                location, boundary, primary_crop, soil_type, irrigation_type, elevation_m
            ) VALUES (
                @Id, @Name, @OwnerId, @RegionId, @SizeHa,
                ST_GeomFromText(@PointWkt, 4326),
                IF(@BoundaryWkt IS NOT NULL, ST_GeomFromText(@BoundaryWkt, 4326), NULL),
                @PrimaryCrop, @SoilType, @IrrigationType, @ElevationM
            );";

        var pointWkt = $"POINT({farm.Longitude} {farm.Latitude})";
        return await conn.ExecuteAsync(sql, new {
            farm.Id,
            farm.Name,
            farm.OwnerId,
            farm.RegionId,
            farm.SizeHa,
            PointWkt = pointWkt,
            farm.BoundaryWkt,
            farm.PrimaryCrop,
            farm.SoilType,
            farm.IrrigationType,
            farm.ElevationM
        });
    }

    public async Task<IEnumerable<Field>> GetFieldsByFarmIdAsync(string farmId)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                farm_id AS FarmId,
                name AS Name,
                area_ha AS AreaHa,
                ST_AsText(boundary) AS BoundaryWkt,
                soil_ph AS SoilPh,
                organic_matter_pct AS OrganicMatterPct,
                drainage_class AS DrainageClass,
                slope_pct AS SlopePct
            FROM fields
            WHERE farm_id = @FarmId;";

        return await conn.QueryAsync<Field>(sql, new { FarmId = farmId });
    }
}
