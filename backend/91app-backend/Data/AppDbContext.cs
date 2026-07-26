using _91app_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace _91app_backend.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var user = modelBuilder.Entity<User>();
        user.ToTable("Users");
        user.HasKey(item => item.Id);
        user.HasIndex(item => item.Username).IsUnique();
        user.Property(item => item.Username).HasMaxLength(100).IsRequired();
        user.Property(item => item.Name).HasMaxLength(100).IsRequired();
        user.Property(item => item.Role).HasMaxLength(20).IsRequired();
        user.Property(item => item.PasswordHash).HasMaxLength(512).IsRequired();
        user.Property(item => item.CreatedAt).IsRequired();
    }
}
