using _91app_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace _91app_backend.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();
    public DbSet<UserWorkItemStatus> UserWorkItemStatuses => Set<UserWorkItemStatus>();

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

        var workItem = modelBuilder.Entity<WorkItem>();
        workItem.ToTable("WorkItems");
        workItem.HasKey(item => item.Id);
        workItem.Property(item => item.Title).HasMaxLength(200).IsRequired();
        workItem.Property(item => item.Description).HasMaxLength(2000);
        workItem.Property(item => item.CreatedAt).IsRequired();
        workItem.Property(item => item.UpdatedAt).IsRequired();

        var userWorkItemStatus = modelBuilder.Entity<UserWorkItemStatus>();
        userWorkItemStatus.ToTable("UserWorkItemStatuses");
        userWorkItemStatus.HasKey(item => new { item.UserId, item.WorkItemId });
        userWorkItemStatus.Property(item => item.Status).IsRequired();
        userWorkItemStatus.Property(item => item.UpdatedAt).IsRequired();
        userWorkItemStatus.HasOne<User>().WithMany().HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Cascade);
        userWorkItemStatus.HasOne<WorkItem>().WithMany().HasForeignKey(item => item.WorkItemId).OnDelete(DeleteBehavior.Cascade);
    }
}
