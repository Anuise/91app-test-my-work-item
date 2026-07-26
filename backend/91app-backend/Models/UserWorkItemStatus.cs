namespace _91app_backend.Models;

public sealed class UserWorkItemStatus
{
    public Guid UserId { get; set; }
    public Guid WorkItemId { get; set; }
    public WorkItemStatus Status { get; set; }
    public DateTimeOffset? ConfirmedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
