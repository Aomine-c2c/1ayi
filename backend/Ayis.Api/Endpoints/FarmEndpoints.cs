using System.Security.Claims;
using Ayis.Api.Models;
using Ayis.Api.Repositories;

namespace Ayis.Api.Endpoints;

public static class FarmEndpoints
{
    public static IEndpointRouteBuilder MapFarmEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Farms ───────────────────────────────────────────────────────────

        // GET /api/v1/farms — List farms (authenticated, results scoped server-side in future)
        app.MapGet("/api/v1/farms", async (FarmRepository farmRepo) =>
        {
            var farms = await farmRepo.GetAllAsync();
            return Results.Ok(farms);
        }).RequireAuthorization().WithName("GetFarms").WithTags("Farms");

        // GET /api/v1/farms/{id}
        app.MapGet("/api/v1/farms/{id}", async (string id, FarmRepository farmRepo) =>
        {
            var farm = await farmRepo.GetByIdAsync(id);
            return farm != null ? Results.Ok(farm) : Results.NotFound();
        }).RequireAuthorization().WithName("GetFarmById").WithTags("Farms");

        // POST /api/v1/farms — Create farm (authenticated; owner stamped from JWT in future)
        app.MapPost("/api/v1/farms", async (Farm farm, FarmRepository farmRepo, ClaimsPrincipal principal) =>
        {
            if (string.IsNullOrWhiteSpace(farm.Name))
                return Results.BadRequest(new { message = "Farm name is required." });

            if (string.IsNullOrEmpty(farm.Id))
                farm.Id = $"farm-{Guid.NewGuid().ToString()[..8]}";

            // Stamp the owner from the authenticated user's JWT claim
            var claimOwner = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(claimOwner))
                farm.OwnerId = claimOwner;
            else if (string.IsNullOrEmpty(farm.OwnerId))
                farm.OwnerId = "u-unknown";

            farm.CreatedAt = DateTime.UtcNow;
            var res = await farmRepo.CreateAsync(farm);
            return res > 0
                ? Results.Created($"/api/v1/farms/{farm.Id}", farm)
                : Results.Problem("Failed to create farm.");
        }).RequireAuthorization().WithName("CreateFarm").WithTags("Farms");

        // PUT /api/v1/farms/{id}
        app.MapPut("/api/v1/farms/{id}", async (string id, Farm farm, FarmRepository farmRepo) =>
        {
            farm.Id = id;
            var ok = await farmRepo.UpdateAsync(farm);
            return ok ? Results.Ok(new { success = true, farm }) : Results.NotFound();
        }).RequireAuthorization().WithName("UpdateFarm").WithTags("Farms");

        // GET /api/v1/farms/{id}/fields
        app.MapGet("/api/v1/farms/{id}/fields", async (string id, FarmRepository farmRepo) =>
        {
            var fields = await farmRepo.GetFieldsByFarmIdAsync(id);
            return Results.Ok(fields);
        }).RequireAuthorization().WithName("GetFarmFields").WithTags("Farms");

        // ── Fields ──────────────────────────────────────────────────────────

        // GET /api/v1/fields
        app.MapGet("/api/v1/fields", async (string? farmId, FarmRepository farmRepo) =>
        {
            var fields = string.IsNullOrEmpty(farmId)
                ? await farmRepo.GetAllFieldsAsync()
                : await farmRepo.GetFieldsByFarmIdAsync(farmId);
            return Results.Ok(fields);
        }).RequireAuthorization().WithName("GetFields").WithTags("Fields");

        // POST /api/v1/fields
        app.MapPost("/api/v1/fields", async (Field field, FarmRepository farmRepo) =>
        {
            if (string.IsNullOrWhiteSpace(field.Name) || string.IsNullOrWhiteSpace(field.FarmId))
                return Results.BadRequest(new { message = "Field name and farm ID are required." });

            if (string.IsNullOrEmpty(field.Id))
                field.Id = $"fld-{Guid.NewGuid().ToString()[..8]}";

            var res = await farmRepo.CreateFieldAsync(field);
            return res > 0
                ? Results.Created($"/api/v1/fields/{field.Id}", field)
                : Results.Problem("Failed to create field.");
        }).RequireAuthorization().WithName("CreateField").WithTags("Fields");

        return app;
    }
}
