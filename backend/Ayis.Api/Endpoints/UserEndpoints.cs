using System.Security.Claims;
using Ayis.Api.Models;
using Ayis.Api.Repositories;
using Ayis.Api.Services;

namespace Ayis.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        // All user-management routes require authentication
        var group = app.MapGroup("/api/v1/users").RequireAuthorization();

        // GET /api/v1/users — List all users (admin, extension & field operations)
        group.MapGet("/", async (UserRepository repo) =>
        {
            var users = await repo.GetAllAsync();
            return Results.Ok(users);
        }).RequireAuthorization(p => p.RequireRole("admin", "super_admin", "system_admin", "extension_officer", "field_officer", "agronomist"))
          .WithName("GetUsers").WithTags("Users");

        // GET /api/v1/users/{id}
        group.MapGet("/{id}", async (string id, UserRepository repo) =>
        {
            var user = await repo.GetByIdAsync(id);
            return user != null ? Results.Ok(user) : Results.NotFound();
        }).RequireAuthorization(p => p.RequireRole("admin", "super_admin", "system_admin"))
          .WithName("GetUserById").WithTags("Users");

        // POST /api/v1/users — Create user with BCrypt-hashed password (admin only)
        group.MapPost("/", async (CreateUserRequest req, UserRepository repo, AuthService authService) =>
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Email))
                return Results.BadRequest(new { message = "Username and email are required." });

            if (string.IsNullOrWhiteSpace(req.Password))
                return Results.BadRequest(new { message = "Password is required." });

            var user = new User
            {
                Id           = $"u-{Guid.NewGuid().ToString()[..8]}",
                Username     = req.Username.Trim(),
                Email        = req.Email.Trim().ToLowerInvariant(),
                PasswordHash = authService.HashPassword(req.Password), // Always BCrypt-hash
                FirstName    = req.FirstName ?? string.Empty,
                LastName     = req.LastName  ?? string.Empty,
                PhoneNumber  = req.PhoneNumber,
                Role         = req.Role ?? "farmer",
                IsActive     = req.IsActive ?? true,
                IsStaff      = req.IsStaff ?? false,
                CreatedAt    = DateTime.UtcNow
            };

            var ok = await repo.CreateAsync(user);
            return ok
                ? Results.Created($"/api/v1/users/{user.Id}", new { user.Id, user.Username, user.Email, user.Role })
                : Results.Problem("Failed to create user.");
        }).RequireAuthorization(p => p.RequireRole("admin", "super_admin", "system_admin"))
          .WithName("CreateUser").WithTags("Users");

        // PUT /api/v1/users/{id} — Update profile fields (admin only)
        group.MapPut("/{id}", async (string id, User user, UserRepository repo) =>
        {
            user.Id = id;
            var ok = await repo.UpdateAsync(user);
            return ok ? Results.Ok(new { success = true, user }) : Results.NotFound();
        }).RequireAuthorization(p => p.RequireRole("admin", "super_admin", "system_admin"))
          .WithName("UpdateUser").WithTags("Users");

        // PATCH /api/v1/users/{id}/status — Activate / deactivate (admin only)
        group.MapPatch("/{id}/status", async (string id, UserStatusRequest req, UserRepository repo) =>
        {
            var ok = await repo.ToggleStatusAsync(id, req.IsActive);
            return ok ? Results.Ok(new { success = true, id, isActive = req.IsActive }) : Results.NotFound();
        }).RequireAuthorization(p => p.RequireRole("admin", "super_admin", "system_admin"))
          .WithName("ToggleUserStatus").WithTags("Users");

        // PATCH /api/v1/users/{id}/password — Change own password (any authenticated user)
        group.MapPatch("/{id}/password", async (string id, ChangePasswordRequest req, ClaimsPrincipal principal,
            UserRepository repo, AuthService authService) =>
        {
            var requesterId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin     = principal.IsInRole("admin") || principal.IsInRole("super_admin") || principal.IsInRole("system_admin");

            // Users can only change their own password; admins can change any
            if (!isAdmin && requesterId != id)
                return Results.Forbid();

            var user = await repo.GetByIdAsync(id);
            if (user == null) return Results.NotFound();

            // Non-admins must supply the current password for verification
            if (!isAdmin && !authService.VerifyPassword(req.CurrentPassword ?? "", user.PasswordHash))
                return Results.Json(new { message = "Current password is incorrect." }, statusCode: 401);

            if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 8)
                return Results.BadRequest(new { message = "New password must be at least 8 characters." });

            var newHash = authService.HashPassword(req.NewPassword);
            var ok      = await repo.UpdatePasswordAsync(id, newHash);
            return ok ? Results.Ok(new { success = true }) : Results.Problem("Failed to update password.");
        }).WithName("ChangePassword").WithTags("Users");

        // DELETE /api/v1/users/{id} — Hard delete (super_admin only)
        group.MapDelete("/{id}", async (string id, UserRepository repo) =>
        {
            var ok = await repo.DeleteAsync(id);
            return ok ? Results.Ok(new { success = true }) : Results.NotFound();
        }).RequireAuthorization(p => p.RequireRole("super_admin"))
          .WithName("DeleteUser").WithTags("Users");

        return app;
    }
}
