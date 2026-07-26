namespace _91app_backend.Models;

public sealed class WorkItem
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
