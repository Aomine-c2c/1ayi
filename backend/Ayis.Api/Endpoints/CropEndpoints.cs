using Ayis.Api.Models;
using Ayis.Api.Repositories;

namespace Ayis.Api.Endpoints;

public static class CropEndpoints
{
    public static IEndpointRouteBuilder MapCropEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Crop Catalog ────────────────────────────────────────────────────

        app.MapGet("/api/v1/crops", async (CropRepository cropRepo) =>
        {
            var crops = await cropRepo.GetAllAsync();
            return Results.Ok(crops);
        }).RequireAuthorization().WithName("GetCrops").WithTags("Crops");

        app.MapGet("/api/v1/crops/{id}", async (string id, CropRepository cropRepo) =>
        {
            var crop = await cropRepo.GetByIdAsync(id);
            return crop != null ? Results.Ok(crop) : Results.NotFound();
        }).RequireAuthorization().WithName("GetCropById").WithTags("Crops");

        // ── Crop Cycles ─────────────────────────────────────────────────────

        app.MapGet("/api/v1/cycles", async (CropRepository cropRepo, string? fieldId) =>
        {
            var cycles = await cropRepo.GetCyclesAsync(fieldId);
            return Results.Ok(cycles);
        }).RequireAuthorization().WithName("GetCycles").WithTags("Cycles");

        app.MapPost("/api/v1/cycles", async (CropCycle cycle, CropRepository cropRepo) =>
        {
            if (string.IsNullOrWhiteSpace(cycle.FieldId) || string.IsNullOrWhiteSpace(cycle.CropId))
                return Results.BadRequest(new { message = "FieldId and CropId are required." });

            if (string.IsNullOrEmpty(cycle.Id))
                cycle.Id = $"cyc-{Guid.NewGuid().ToString()[..8]}";

            var ok = await cropRepo.CreateCycleAsync(cycle);
            return ok
                ? Results.Created($"/api/v1/cycles/{cycle.Id}", cycle)
                : Results.Problem("Failed to create crop cycle.");
        }).RequireAuthorization().WithName("CreateCycle").WithTags("Cycles");

        return app;
    }
}
