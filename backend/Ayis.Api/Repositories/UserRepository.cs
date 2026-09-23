using Dapper;
using Ayis.Api.Data;
using Ayis.Api.Models;

namespace Ayis.Api.Repositories;

public class UserRepository
{
    private readonly IDbConnectionFactory _db;

    public UserRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<User?> GetByUsernameOrEmailAsync(string identifier)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                username AS Username,
                email AS Email,
                password_hash AS PasswordHash,
                first_name AS FirstName,
                last_name AS LastName,
                phone_number AS PhoneNumber,
                role AS Role,
                is_active AS IsActive,
                is_staff AS IsStaff,
                created_at AS CreatedAt
            FROM users 
            WHERE username = @Identifier OR email = @Identifier 
            LIMIT 1;";

        return await conn.QuerySingleOrDefaultAsync<User>(sql, new { Identifier = identifier });
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                username AS Username,
                email AS Email,
                password_hash AS PasswordHash,
                first_name AS FirstName,
                last_name AS LastName,
                phone_number AS PhoneNumber,
                role AS Role,
                is_active AS IsActive,
                is_staff AS IsStaff,
                created_at AS CreatedAt
            FROM users 
            WHERE id = @Id 
            LIMIT 1;";

        return await conn.QuerySingleOrDefaultAsync<User>(sql, new { Id = id });
    }

    public async Task<IEnumerable<User>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT 
                id AS Id,
                username AS Username,
                email AS Email,
                password_hash AS PasswordHash,
                first_name AS FirstName,
                last_name AS LastName,
                phone_number AS PhoneNumber,
                role AS Role,
                is_active AS IsActive,
                is_staff AS IsStaff,
                created_at AS CreatedAt
            FROM users 
            ORDER BY created_at DESC;";

        return await conn.QueryAsync<User>(sql);
    }

    public async Task<bool> CreateAsync(User user)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO users (id, username, email, password_hash, first_name, last_name, phone_number, role, is_active, is_staff)
            VALUES (@Id, @Username, @Email, @PasswordHash, @FirstName, @LastName, @PhoneNumber, @Role, @IsActive, @IsStaff);";

        var affected = await conn.ExecuteAsync(sql, user);
        return affected > 0;
    }

    public async Task<bool> UpdateAsync(User user)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            UPDATE users SET 
                first_name = @FirstName,
                last_name = @LastName,
                phone_number = @PhoneNumber,
                role = @Role,
                updated_at = datetime('now')
            WHERE id = @Id;";

        var affected = await conn.ExecuteAsync(sql, user);
        return affected > 0;
    }

    public async Task<bool> ToggleStatusAsync(string id, bool isActive)
    {
        using var conn = _db.CreateConnection();
        var sql = @"UPDATE users SET is_active = @IsActive, updated_at = datetime('now') WHERE id = @Id;";
        var affected = await conn.ExecuteAsync(sql, new { Id = id, IsActive = isActive ? 1 : 0 });
        return affected > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var conn = _db.CreateConnection();
        var sql = @"DELETE FROM users WHERE id = @Id;";
        var affected = await conn.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }
}
