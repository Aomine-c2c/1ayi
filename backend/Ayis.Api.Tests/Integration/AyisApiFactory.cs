using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ayis.Api.Data;

namespace Ayis.Api.Tests.Integration;

public class AyisApiFactory : WebApplicationFactory<Program>
{
    private readonly string _testDbPath;

    public AyisApiFactory()
    {
        _testDbPath = Path.Combine(Path.GetTempPath(), $"ayis_api_test_{Guid.NewGuid():N}.db");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "",
                ["Jwt:Key"] = "AYIS_DEV_SECRET_KEY_CHANGE_IN_PRODUCTION_MIN_32_CHARS!",
                ["Jwt:Issuer"] = "Ayis.Api",
                ["Jwt:Audience"] = "Ayis.Frontend",
                ["AccuWeather:ApiKey"] = "test-placeholder-key"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Replace IDbConnectionFactory with an isolated test SQLite database
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IDbConnectionFactory));
            if (descriptor != null)
                services.Remove(descriptor);

            var connStr = $"Data Source={_testDbPath}";
            var factory = new SqliteConnectionFactory(connStr);
            SqliteDatabaseInitializer.Initialize(factory);
            services.AddSingleton<IDbConnectionFactory>(factory);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        SqliteConnection.ClearAllPools();
        if (File.Exists(_testDbPath))
        {
            try { File.Delete(_testDbPath); } catch { /* ignore */ }
        }
    }
}
