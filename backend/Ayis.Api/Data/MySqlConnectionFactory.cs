using System.Data;
using MySqlConnector;

namespace Ayis.Api.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}

public class MySqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public MySqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("DefaultConnection connection string not found.");
    }

    public IDbConnection CreateConnection()
    {
        var connection = new MySqlConnection(_connectionString);
        return connection;
    }
}
