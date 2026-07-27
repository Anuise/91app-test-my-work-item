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

// 詳情：包含 Work Item 完整欄位與依登入者解析的個人化狀態。
// UpdatedAt 為 Work Item 本身的最後更新時間（項目稽核時間戳）。
public sealed record WorkItemDetail(
    Guid Id,
    string Title,
    string? Description,
    WorkItemStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record BulkConfirmRequest(IReadOnlyList<Guid> WorkItemIds);

public sealed record BulkConfirmResult(int ConfirmedCount, int IgnoredCount);

public sealed record RevokeResult(bool Revoked);
