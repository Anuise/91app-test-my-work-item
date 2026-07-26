using _91app_backend.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _91app_backend.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260726143000_CreateUsers")]
public partial class CreateUsers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                PasswordHash = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", item => item.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Users_Username",
            table: "Users",
            column: "Username",
            unique: true);

        migrationBuilder.Sql(
            """
            INSERT INTO "Users" ("Id", "CreatedAt", "Name", "PasswordHash", "Role", "Username")
            VALUES
                ('8d89c4b0-490b-4f58-a9ba-494bfbd5556f', '2026-07-26T00:00:00+00:00', 'User', 'AQAAAAIAAYagAAAAEAARIjNEVWZ3iJmqu8zd7v+yW8t88rpEqiYjg+l1hFnLeWkzbdQutGnMibJOBt4ZKA==', 'User', 'user'),
                ('88afcf77-64af-4b9b-8414-5737be0906f2', '2026-07-26T00:00:00+00:00', 'Admin', 'AQAAAAIAAYagAAAAEP/u3cy7qpmId2ZVRDMiEQAcR+SQ75eKr5IXGD38gWDl6ZNSCh3uMXwxUc4CKU+2KA==', 'Admin', 'admin');
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Users");
    }
}
