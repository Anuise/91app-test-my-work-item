using _91app_backend.Models;

namespace _91app_backend.Contracts;

public enum WorkItemSortOrder
{
    Ascending,
    Descending
}

// 排序欄位白名單（ADR 0015）：僅允許 createdAt 與 title，避免任意欄位排序。
public enum WorkItemSortField
{
    CreatedAt,
    Title
}

// 個人化狀態過濾器（ADR 0012）：All 不過濾，Pending／Confirmed 針對呼叫者解析後的狀態。
public enum WorkItemStatusFilter
{
    All,
    Pending,
    Confirmed
}

public sealed record WorkItemListItem(
    Guid Id,
    string Title,
    string? Description,
    WorkItemStatus Status,
    DateTimeOffset CreatedAt);

// 列表分頁結果（ADR 0015）：items 為當前頁項目，totalCount 為過濾後總數供前端渲染分頁控制。
public sealed record PagedWorkItems(
    IReadOnlyList<WorkItemListItem> Items,
    int Page,
    int PageSize,
    int TotalCount);

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

public sealed record AdminWorkItemListItem(
    Guid Id,
    string Title,
    string? Description,
    DateTimeOffset CreatedAt);

public sealed record CreateWorkItemRequest(string? Title, string? Description);

public sealed record CreatedWorkItem(
    Guid Id,
    string Title,
    string? Description,
    DateTimeOffset CreatedAt);

public sealed record UpdateWorkItemRequest(string? Title, string? Description);

public sealed record UpdatedWorkItem(
    Guid Id,
    string Title,
    string? Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
