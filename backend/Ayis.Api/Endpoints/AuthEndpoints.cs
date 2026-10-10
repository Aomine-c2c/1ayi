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

            var user = await userRepo.GetByUsernameOrEmailAsync(req.Username.Trim());
            if (user == null || !authService.VerifyPassword(req.Password, user.PasswordHash))
                return Results.Json(new { message = "Invalid credentials." }, statusCode: 401);

            if (!user.IsActive)
            {
                var requiresAdminApproval = user.Role is "admin" or "system_admin" or "super_admin";
                var errorMsg = requiresAdminApproval
                    ? "Account is pending administrator approval before you can sign in."
                    : "Account is disabled. Contact an administrator.";
                return Results.Json(new { message = errorMsg, pending_approval = requiresAdminApproval }, statusCode: 403);
            }

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

        // POST /api/v1/auth/register — Public Registration
        app.MapPost("/api/v1/auth/register", async (RegisterRequest req, UserRepository userRepo, AuthService authService) =>
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Email))
                return Results.BadRequest(new { message = "Username and email address are required." });

            if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
                return Results.BadRequest(new { message = "Password must be at least 6 characters long." });

            var cleanUsername = req.Username.Trim();
            var cleanEmail = req.Email.Trim().ToLowerInvariant();

            // Check if username or email is already registered
            var existingUser = await userRepo.GetByUsernameOrEmailAsync(cleanUsername);
            if (existingUser != null)
                return Results.Conflict(new { message = "Username is already taken. Please choose another username." });

            var existingEmail = await userRepo.GetByUsernameOrEmailAsync(cleanEmail);
            if (existingEmail != null)
                return Results.Conflict(new { message = "Email address is already registered. Please sign in or use another email." });

            var rawRole = (req.Role ?? "farmer").Trim().ToLowerInvariant();
            var allowedRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "farmer", "agronomist", "extension_officer", "weather_analyst",
                "farm_manager", "field_officer", "system_admin", "super_admin", "admin"
            };

            var normalizedRole = allowedRoles.Contains(rawRole) ? rawRole : "farmer";
            if (normalizedRole == "admin") normalizedRole = "system_admin";

            // Roles requiring admin approval before entering system
            var requiresApproval = normalizedRole is "system_admin" or "super_admin";
            var isActive = !requiresApproval;

            var newUser = new User
            {
                Id           = $"u-{Guid.NewGuid().ToString()[..8]}",
                Username     = cleanUsername,
                Email        = cleanEmail,
                PasswordHash = authService.HashPassword(req.Password),
                FirstName    = req.FirstName?.Trim() ?? string.Empty,
                LastName     = req.LastName?.Trim() ?? string.Empty,
                PhoneNumber  = req.PhoneNumber?.Trim(),
                Role         = normalizedRole,
                IsActive     = isActive,
                IsStaff      = normalizedRole is "system_admin" or "super_admin",
                CreatedAt    = DateTime.UtcNow
            };

            var created = await userRepo.CreateAsync(newUser);
            if (!created)
                return Results.Problem("Failed to create user account. Please try again.");

            return Results.Created($"/api/v1/users/{newUser.Id}", new
            {
                message = requiresApproval
                    ? "Registration successful! Your administrative account requires administrator approval before you can sign in."
                    : "Registration successful! You can now sign in with your credentials.",
                requires_approval = requiresApproval,
                user = new
                {
                    id         = newUser.Id,
                    username   = newUser.Username,
                    email      = newUser.Email,
                    role       = newUser.Role,
                    first_name = newUser.FirstName,
                    last_name  = newUser.LastName,
                    is_active  = newUser.IsActive
                }
            });
        }).WithName("Register").WithTags("Auth").AllowAnonymous();

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
