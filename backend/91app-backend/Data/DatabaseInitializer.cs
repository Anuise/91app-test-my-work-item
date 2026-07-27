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

        var createdAt = new DateTimeOffset(2026, 7, 26, 0, 0, 0, TimeSpan.Zero);

        if (!await context.Users.AnyAsync(item => item.Username == "user"))
        {
            var user = new User
            {
                Id = Guid.Parse("8d89c4b0-490b-4f58-a9ba-494bfbd5556f"),
                Username = "user",
                Name = "User",
                Role = "User",
                PasswordHash = UserPasswordHash,
                CreatedAt = createdAt
            };
            context.Users.Add(user);
        }

        if (!await context.Users.AnyAsync(item => item.Username == "user2"))
        {
            var secondUser = new User
            {
                Id = Guid.Parse("7489e3ba-fde8-4a79-8bcb-ced424509de3"),
                Username = "user2",
                Name = "User 2",
                Role = "User",
                PasswordHash = UserPasswordHash,
                CreatedAt = createdAt
            };
            context.Users.Add(secondUser);
        }

        if (!await context.Users.AnyAsync(item => item.Username == "admin"))
        {
            var admin = new User
            {
                Id = Guid.Parse("88afcf77-64af-4b9b-8414-5737be0906f2"),
                Username = "admin",
                Name = "Admin",
                Role = "Admin",
                PasswordHash = AdminPasswordHash,
                CreatedAt = createdAt
            };
            context.Users.Add(admin);
        }

        if (!await context.WorkItems.AnyAsync())
        {
            context.WorkItems.AddRange(
                new WorkItem
                {
                    Id = Guid.Parse("1a1f0a3c-3b6d-4b8a-9c0a-1e2d3c4b5a61"),
                    Title = "設定本機開發環境",
                    Description = "安裝 .NET 10 SDK、Node.js 與 Docker，並以 docker compose 啟動 PostgreSQL 資料庫。",
                    CreatedAt = createdAt.AddHours(1),
                    UpdatedAt = createdAt.AddHours(1)
                },
                new WorkItem
                {
                    Id = Guid.Parse("2b2f0b4c-4c7e-4c9b-8d1b-2f3e4d5c6b72"),
                    Title = "撰寫個人化狀態單元測試",
                    Description = "涵蓋隱式 Pending、冪等 Confirmed upsert 與撤銷轉換等個人化狀態規則。",
                    CreatedAt = createdAt.AddHours(2),
                    UpdatedAt = createdAt.AddHours(2)
                },
                new WorkItem
                {
                    Id = Guid.Parse("3c3f0c5d-5d8f-4dac-9e2c-3a4f5e6d7c83"),
                    Title = "部署至測試環境並驗證",
                    Description = null,
                    CreatedAt = createdAt.AddHours(3),
                    UpdatedAt = createdAt.AddHours(3)
                });
        }

        await context.SaveChangesAsync();
    }
}
