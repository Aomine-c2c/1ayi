using FluentAssertions;
using Dapper;
using Microsoft.Data.Sqlite;
using Ayis.Api.Data;
using Ayis.Api.Models;
using Ayis.Api.Repositories;
using Ayis.Api.Services;

namespace Ayis.Api.Tests.Integration;

/// <summary>
/// Integration tests for UserRepository using an in-memory SQLite database.
/// These tests verify the full SQL→model round-trip without mocking.
/// </summary>
public class UserRepositoryTests : IDisposable
{
    private readonly string _dbPath;
    private readonly UserRepository _repo;

    public UserRepositoryTests()
    {
        _dbPath = Path.Combine(Path.GetTempPath(), $"ayis_test_{Guid.NewGuid():N}.db");
        var connStr = $"Data Source={_dbPath}";

        using (var bootstrapConn = new SqliteConnection(connStr))
        {
            bootstrapConn.Open();
            bootstrapConn.Execute(@"
                CREATE TABLE users (
                    id           TEXT PRIMARY KEY,
                    username     TEXT NOT NULL UNIQUE,
                    email        TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    first_name   TEXT DEFAULT '',
                    last_name    TEXT DEFAULT '',
                    phone_number TEXT,
                    role         TEXT DEFAULT 'farmer',
                    is_active    INTEGER DEFAULT 1,
                    is_staff     INTEGER DEFAULT 0,
                    created_at   TEXT DEFAULT (datetime('now')),
                    updated_at   TEXT DEFAULT (datetime('now'))
                );");
        }

        var factory = new SqliteConnectionFactory(connStr);
        _repo       = new UserRepository(factory);
    }

    // ── Create & Fetch ────────────────────────────────────────────────────────

    [Fact]
    public async Task CreateAsync_AndGetById_RoundTripsSuccessfully()
    {
        var user = SampleUser("u-001");
        var ok   = await _repo.CreateAsync(user);

        ok.Should().BeTrue();

        var fetched = await _repo.GetByIdAsync("u-001");
        fetched.Should().NotBeNull();
        fetched!.Username.Should().Be(user.Username);
        fetched.Email.Should().Be(user.Email);
        fetched.Role.Should().Be(user.Role);
    }

    [Fact]
    public async Task GetByUsernameOrEmail_FindsByEmail()
    {
        var user = SampleUser("u-002");
        await _repo.CreateAsync(user);

        var result = await _repo.GetByUsernameOrEmailAsync(user.Email);
        result.Should().NotBeNull();
        result!.Id.Should().Be("u-002");
    }

    [Fact]
    public async Task GetByUsernameOrEmail_FindsByUsername()
    {
        var user = SampleUser("u-003");
        await _repo.CreateAsync(user);

        var result = await _repo.GetByUsernameOrEmailAsync(user.Username);
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GetByUsernameOrEmail_ReturnsNull_WhenNotFound()
    {
        var result = await _repo.GetByUsernameOrEmailAsync("nonexistent@example.com");
        result.Should().BeNull();
    }

    // ── Update & Status ───────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateAsync_ChangesFirstAndLastName()
    {
        var user = SampleUser("u-004");
        await _repo.CreateAsync(user);

        user.FirstName = "Updated";
        user.LastName  = "Name";
        var ok = await _repo.UpdateAsync(user);

        ok.Should().BeTrue();
        var fetched = await _repo.GetByIdAsync("u-004");
        fetched!.FirstName.Should().Be("Updated");
    }

    [Fact]
    public async Task ToggleStatusAsync_DeactivatesAndReactivatesUser()
    {
        var user = SampleUser("u-005");
        await _repo.CreateAsync(user);

        // Deactivate
        (await _repo.ToggleStatusAsync("u-005", false)).Should().BeTrue();
        var deactivated = await _repo.GetByIdAsync("u-005");
        deactivated!.IsActive.Should().BeFalse();

        // Reactivate
        (await _repo.ToggleStatusAsync("u-005", true)).Should().BeTrue();
        var reactivated = await _repo.GetByIdAsync("u-005");
        reactivated!.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task UpdatePasswordAsync_PersistsNewHash()
    {
        var user    = SampleUser("u-006");
        await _repo.CreateAsync(user);

        var newHash = BCrypt.Net.BCrypt.HashPassword("NewSecurePass!", 4); // low cost for speed in tests
        var ok      = await _repo.UpdatePasswordAsync("u-006", newHash);

        ok.Should().BeTrue();
        var fetched = await _repo.GetByUsernameOrEmailAsync(user.Username);
        fetched!.PasswordHash.Should().Be(newHash);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task DeleteAsync_RemovesUserFromDatabase()
    {
        var user = SampleUser("u-007");
        await _repo.CreateAsync(user);

        var ok      = await _repo.DeleteAsync("u-007");
        var fetched = await _repo.GetByIdAsync("u-007");

        ok.Should().BeTrue();
        fetched.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_ReturnsFalse_WhenUserDoesNotExist()
    {
        var ok = await _repo.DeleteAsync("nonexistent-id");
        ok.Should().BeFalse();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static User SampleUser(string id) => new()
    {
        Id           = id,
        Username     = $"user_{id}",
        Email        = $"{id}@test.ayis.org",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!", 4),
        FirstName    = "Test",
        LastName     = "User",
        Role         = "farmer",
        IsActive     = true,
        IsStaff      = false
    };

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        if (File.Exists(_dbPath))
        {
            try { File.Delete(_dbPath); } catch { /* ignore */ }
        }
    }
}
