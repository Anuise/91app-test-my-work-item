using _91app_backend.Models;

namespace _91app_backend.Contracts;

public enum WorkItemSortOrder
{
    Ascending,
    Descending
}

public sealed record WorkItemListItem(
    Guid Id,
    string Title,
    WorkItemStatus Status,
    DateTimeOffset CreatedAt);
