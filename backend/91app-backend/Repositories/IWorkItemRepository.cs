using _91app_backend.Contracts;

namespace _91app_backend.Repositories;

public interface IWorkItemRepository
{
    Task<IReadOnlyList<AdminWorkItemListItem>> GetAdminWorkItemsAsync(
        CancellationToken cancellationToken);

    Task<CreatedWorkItem> CreateAsync(
        string title,
        string? description,
        CancellationToken cancellationToken);

    Task<AdminWorkItemListItem?> GetAdminWorkItemAsync(
        Guid workItemId,
        CancellationToken cancellationToken);

    Task<UpdatedWorkItem?> UpdateAsync(
        Guid workItemId,
        string title,
        string? description,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(
        Guid workItemId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<WorkItemListItem>> GetWorkItemsForUserAsync(
        Guid userId,
        WorkItemSortOrder sortOrder,
        CancellationToken cancellationToken);

    // 取得單筆 active Work Item 詳情並依登入者解析個人化狀態；項目不存在時回傳 null。
    Task<WorkItemDetail?> GetDetailForUserAsync(
        Guid userId,
        Guid workItemId,
        CancellationToken cancellationToken);

    // 將指定使用者對多筆 Work Item 的狀態冪等 upsert 為 Confirmed，回傳實際被確認的（仍存在的）項目數量。
    Task<int> ConfirmForUserAsync(
        Guid userId,
        IReadOnlyCollection<Guid> workItemIds,
        CancellationToken cancellationToken);

    // 將指定使用者對單筆 Work Item 的狀態由 Confirmed 撤銷回 Pending，回傳是否確實發生變更（僅 Confirmed 可撤銷）。
    Task<bool> RevokeForUserAsync(
        Guid userId,
        Guid workItemId,
        CancellationToken cancellationToken);
}
