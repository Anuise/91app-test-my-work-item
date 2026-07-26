using _91app_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace _91app_backend.Data;

public static class DatabaseInitializer
{
    private const string UserPasswordHash = "AQAAAAIAAYagAAAAEAARIjNEVWZ3iJmqu8zd7v+yW8t88rpEqiYjg+l1hFnLeWkzbdQutGnMibJOBt4ZKA==";
    private const string AdminPasswordHash = "AQAAAAIAAYagAAAAEP/u3cy7qpmId2ZVRDMiEQAcR+SQ75eKr5IXGD38gWDl6ZNSCh3uMXwxUc4CKU+2KA==";

    public static async Task InitializeAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        if (await context.Users.AnyAsync())
        {
            return;
        }

        var createdAt = new DateTimeOffset(2026, 7, 26, 0, 0, 0, TimeSpan.Zero);
        var user = new User
        {
            Id = Guid.Parse("8d89c4b0-490b-4f58-a9ba-494bfbd5556f"),
            Username = "user",
            Name = "User",
            Role = "User",
            PasswordHash = UserPasswordHash,
            CreatedAt = createdAt
        };
        var admin = new User
        {
            Id = Guid.Parse("88afcf77-64af-4b9b-8414-5737be0906f2"),
            Username = "admin",
            Name = "Admin",
            Role = "Admin",
            PasswordHash = AdminPasswordHash,
            CreatedAt = createdAt
        };
        context.Users.AddRange(user, admin);
        await context.SaveChangesAsync();
    }
}
