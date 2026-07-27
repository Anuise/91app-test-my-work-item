using _91app_backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _91app_backend.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260727160000_SeedSecondDemoUser")]
    public partial class SeedSecondDemoUser : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT INTO "Users" ("Id", "CreatedAt", "Name", "PasswordHash", "Role", "Username")
                VALUES ('7489e3ba-fde8-4a79-8bcb-ced424509de3', '2026-07-26T00:00:00+00:00', 'User 2', 'AQAAAAIAAYagAAAAEAARIjNEVWZ3iJmqu8zd7v+yW8t88rpEqiYjg+l1hFnLeWkzbdQutGnMibJOBt4ZKA==', 'User', 'user2')
                ON CONFLICT ("Username") DO NOTHING;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM "Users"
                WHERE "Id" = '7489e3ba-fde8-4a79-8bcb-ced424509de3';
                """);
        }
    }
}
