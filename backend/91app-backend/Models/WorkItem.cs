namespace _91app_backend.Models;

public sealed class WorkItem
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    // 描述為選填欄位（規格：Admin 建立時 title 必填、description 選填）。
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
