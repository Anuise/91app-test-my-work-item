namespace _91app_backend.Models;

public sealed class User
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string Name { get; set; }
    public required string Role { get; set; }
    public required string PasswordHash { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
