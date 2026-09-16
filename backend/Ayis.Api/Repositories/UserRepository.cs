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
}
