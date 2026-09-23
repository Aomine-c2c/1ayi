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
                latitude AS Latitude,
                longitude AS Longitude,
                boundary_wkt AS BoundaryWkt,
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
                latitude AS Latitude,
                longitude AS Longitude,
                boundary_wkt AS BoundaryWkt,
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
                latitude, longitude, boundary_wkt, primary_crop, soil_type, irrigation_type, elevation_m
            ) VALUES (
                @Id, @Name, @OwnerId, @RegionId, @SizeHa,
                @Latitude, @Longitude, @BoundaryWkt,
                @PrimaryCrop, @SoilType, @IrrigationType, @ElevationM
            );";

        return await conn.ExecuteAsync(sql, new {
            farm.Id,
            farm.Name,
            farm.OwnerId,
            farm.RegionId,
            farm.SizeHa,
            farm.Latitude,
            farm.Longitude,
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
                boundary_wkt AS BoundaryWkt,
                soil_ph AS SoilPh,
                organic_matter_pct AS OrganicMatterPct,
                drainage_class AS DrainageClass,
                slope_pct AS SlopePct
            FROM fields
            WHERE farm_id = @FarmId;";

        return await conn.QueryAsync<Field>(sql, new { FarmId = farmId });
    }

    public async Task<IEnumerable<Field>> GetAllFieldsAsync()
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                farm_id AS FarmId,
                name AS Name,
                area_ha AS AreaHa,
                boundary_wkt AS BoundaryWkt,
                soil_ph AS SoilPh,
                organic_matter_pct AS OrganicMatterPct,
                drainage_class AS DrainageClass,
                slope_pct AS SlopePct
            FROM fields;";

        return await conn.QueryAsync<Field>(sql);
    }

    public async Task<bool> UpdateAsync(Farm farm)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            UPDATE farms SET
                name = @Name,
                region_id = @RegionId,
                size_ha = @SizeHa,
                latitude = @Latitude,
                longitude = @Longitude,
                boundary_wkt = @BoundaryWkt,
                primary_crop = @PrimaryCrop,
                soil_type = @SoilType,
                irrigation_type = @IrrigationType,
                elevation_m = @ElevationM,
                updated_at = datetime('now')
            WHERE id = @Id;";

        var affected = await conn.ExecuteAsync(sql, farm);
        return affected > 0;
    }

    public async Task<int> CreateFieldAsync(Field field)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO fields (id, farm_id, name, area_ha, boundary_wkt, soil_ph, organic_matter_pct, drainage_class, slope_pct)
            VALUES (@Id, @FarmId, @Name, @AreaHa, @BoundaryWkt, @SoilPh, @OrganicMatterPct, @DrainageClass, @SlopePct);";

        return await conn.ExecuteAsync(sql, field);
    }
}
