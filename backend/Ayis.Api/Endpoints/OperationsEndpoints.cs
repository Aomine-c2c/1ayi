using Ayis.Api.Models;
using Ayis.Api.Repositories;

namespace Ayis.Api.Endpoints;

public static class OperationsEndpoints
{
    public static IEndpointRouteBuilder MapOperationsEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Notifications ────────────────────────────────────────────────────

        app.MapGet("/api/v1/notifications", async (WeatherAndIntelligenceRepository repo) =>
        {
            var notifications = await repo.GetNotificationsAsync();
            return Results.Ok(notifications);
        }).RequireAuthorization().WithName("GetNotifications").WithTags("Notifications");

        app.MapPatch("/api/v1/notifications/{id}/read", async (string id, WeatherAndIntelligenceRepository repo) =>
        {
            var ok = await repo.MarkNotificationAsReadAsync(id);
            return ok ? Results.Ok(new { success = true }) : Results.NotFound();
        }).RequireAuthorization().WithName("MarkNotificationAsRead").WithTags("Notifications");

        app.MapPost("/api/v1/notifications/read-all", async (WeatherAndIntelligenceRepository repo) =>
        {
            await repo.MarkAllNotificationsAsReadAsync();
            return Results.Ok(new { success = true });
        }).RequireAuthorization().WithName("MarkAllNotificationsAsRead").WithTags("Notifications");

        // ── Inspections ──────────────────────────────────────────────────────

        app.MapGet("/api/v1/inspections", async (WeatherAndIntelligenceRepository repo) =>
        {
            var inspections = await repo.GetInspectionsAsync();
            return Results.Ok(inspections);
        }).RequireAuthorization().WithName("GetInspections").WithTags("FieldOperations");

        app.MapPost("/api/v1/inspections", async (FieldInspectionItem inspection, WeatherAndIntelligenceRepository repo) =>
        {
            if (string.IsNullOrEmpty(inspection.Id))
                inspection.Id = $"insp-{Guid.NewGuid().ToString()[..8]}";
            inspection.InspectionDate = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm");

            var ok = await repo.CreateInspectionAsync(inspection);
            return ok
                ? Results.Created($"/api/v1/inspections/{inspection.Id}", inspection)
                : Results.Problem("Failed to create inspection.");
        }).RequireAuthorization().WithName("CreateInspection").WithTags("FieldOperations");

        // ── Observations ─────────────────────────────────────────────────────

        app.MapGet("/api/v1/observations", async (string? fieldId, WeatherAndIntelligenceRepository repo) =>
        {
            var obs = await repo.GetObservationsAsync(fieldId);
            return Results.Ok(obs);
        }).RequireAuthorization().WithName("GetObservations").WithTags("FieldOperations");

        app.MapPost("/api/v1/observations", async (FieldObservationItem obs, WeatherAndIntelligenceRepository repo) =>
        {
            if (string.IsNullOrEmpty(obs.Id))
                obs.Id = $"obs-{Guid.NewGuid().ToString()[..8]}";
            obs.Date = DateTime.UtcNow.ToString("yyyy-MM-dd");

            var ok = await repo.CreateObservationAsync(obs);
            return ok
                ? Results.Created($"/api/v1/observations/{obs.Id}", obs)
                : Results.Problem("Failed to create observation.");
        }).RequireAuthorization().WithName("CreateObservation").WithTags("FieldOperations");

        // ── Tasks ────────────────────────────────────────────────────────────

        app.MapGet("/api/v1/tasks", async (WeatherAndIntelligenceRepository repo) =>
        {
            var tasks = await repo.GetTasksAsync();
            return Results.Ok(tasks);
        }).RequireAuthorization().WithName("GetTasks").WithTags("FieldOperations");

        app.MapPatch("/api/v1/tasks/{id}/status", async (string id, TaskStatusRequest req, WeatherAndIntelligenceRepository repo) =>
        {
            var ok = await repo.UpdateTaskStatusAsync(id, req.Status);
            return ok
                ? Results.Ok(new { success = true, id, status = req.Status })
                : Results.NotFound();
        }).RequireAuthorization().WithName("UpdateTaskStatus").WithTags("FieldOperations");

        // ── Reports ──────────────────────────────────────────────────────────

        app.MapGet("/api/v1/reports", async (WeatherAndIntelligenceRepository repo) =>
        {
            var reports = await repo.GetReportsAsync();
            return Results.Ok(reports);
        }).RequireAuthorization().WithName("GetReports").WithTags("Reports");

        app.MapPost("/api/v1/reports/generate", async (ReportItem report, WeatherAndIntelligenceRepository repo) =>
        {
            if (string.IsNullOrEmpty(report.Id))
                report.Id = $"rep-{Guid.NewGuid().ToString()[..8]}";
            report.Date      = DateTime.UtcNow.ToString("yyyy-MM-dd");
            report.Status    = "READY";
            report.CreatedAt = DateTime.UtcNow;

            await repo.CreateReportAsync(report);
            return Results.Created($"/api/v1/reports/{report.Id}", report);
        }).RequireAuthorization().WithName("GenerateReport").WithTags("Reports");

        // ── Audit Logs ───────────────────────────────────────────────────────

        app.MapGet("/api/v1/audit-logs", async (WeatherAndIntelligenceRepository repo) =>
        {
            var logs = await repo.GetAuditLogsAsync();
            return Results.Ok(logs);
        }).RequireAuthorization(p => p.RequireRole("admin", "super_admin", "system_admin"))
          .WithName("GetAuditLogs").WithTags("Audit");

        app.MapPost("/api/v1/audit-logs", async (AuditLogItem log, WeatherAndIntelligenceRepository repo) =>
        {
            if (string.IsNullOrEmpty(log.Id))
                log.Id = $"aud-{Guid.NewGuid().ToString()[..8]}";
            log.Timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");

            await repo.CreateAuditLogAsync(log);
            return Results.Created($"/api/v1/audit-logs/{log.Id}", log);
        }).RequireAuthorization().WithName("CreateAuditLog").WithTags("Audit");

        return app;
    }
}
