using System.Security.Claims;
using Dapper;
using Ayis.Api.Data;
using Ayis.Api.Models;
using Ayis.Api.Repositories;
using Ayis.Api.Services;

namespace Ayis.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        // POST /api/v1/auth/token — Login
        app.MapPost("/api/v1/auth/token", async (LoginRequest req, UserRepository userRepo, AuthService authService) =>
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
                return Results.BadRequest(new { message = "Username and password are required." });

            var user = await userRepo.GetByUsernameOrEmailAsync(req.Username);
            if (user == null || !authService.VerifyPassword(req.Password, user.PasswordHash))
                return Results.Json(new { message = "Invalid credentials." }, statusCode: 401);

            if (!user.IsActive)
                return Results.Json(new { message = "Account is disabled. Contact an administrator." }, statusCode: 403);

            var token = authService.GenerateJwtToken(user);
            return Results.Ok(new
            {
                access_token = token,
                token_type   = "bearer",
                expires_in   = 1440 * 60,
                user = new
                {
                    id         = user.Id,
                    username   = user.Username,
                    email      = user.Email,
                    role       = user.Role,
                    first_name = user.FirstName,
                    last_name  = user.LastName,
                    is_staff   = user.IsStaff
                }
            });
        }).WithName("Login").WithTags("Auth").AllowAnonymous();

        // GET /api/v1/auth/me — Current authenticated user profile
        app.MapGet("/api/v1/auth/me", async (ClaimsPrincipal principal, UserRepository userRepo) =>
        {
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var user = await userRepo.GetByIdAsync(userId);
            return user != null ? Results.Ok(new
            {
                id          = user.Id,
                username    = user.Username,
                email       = user.Email,
                first_name  = user.FirstName,
                last_name   = user.LastName,
                phone_number= user.PhoneNumber,
                role        = user.Role,
                is_active   = user.IsActive,
                is_staff    = user.IsStaff,
                created_at  = user.CreatedAt
            }) : Results.NotFound();
        }).RequireAuthorization().WithName("GetCurrentUser").WithTags("Auth");

        // GET /api/v1/auth/demo-users — Preconfigured personas from the database
        app.MapGet("/api/v1/auth/demo-users", async (IDbConnectionFactory db) =>
        {
            using var conn = db.CreateConnection();
            var sql = @"
                SELECT 
                    id, 
                    username, 
                    first_name AS FirstName, 
                    last_name AS LastName, 
                    email AS Email, 
                    role AS Role
                FROM users 
                WHERE username IN ('chief', 'admin', 'alexk', 'sarahm', 'gracew', 'danielk', 'davidm', 'johnk', 'alicec', 'peterk')
                ORDER BY 
                  CASE role 
                    WHEN 'farmer' THEN 1 
                    WHEN 'agronomist' THEN 2 
                    WHEN 'system_admin' THEN 3 
                    WHEN 'extension_officer' THEN 4 
                    WHEN 'weather_analyst' THEN 5 
                    WHEN 'farm_manager' THEN 6 
                    WHEN 'field_officer' THEN 7 
                    WHEN 'super_admin' THEN 8 
                    ELSE 9 
                  END;";
            var users = await conn.QueryAsync(sql);
            return Results.Ok(users);
        }).AllowAnonymous().WithName("GetDemoUsers").WithTags("Auth");

        return app;
    }
}
