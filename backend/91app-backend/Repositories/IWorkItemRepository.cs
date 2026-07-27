using _91app_backend.Contracts;

namespace _91app_backend.Repositories;

public interface IWorkItemRepository
{
    Task<IReadOnlyList<WorkItemListItem>> GetWorkItemsForUserAsync(
        Guid userId,
        WorkItemSortOrder sortOrder,
        CancellationToken cancellationToken);

    // 將指定使用者對多筆 Work Item 的狀態冪等 upsert 為 Confirmed，回傳實際被確認的（仍存在的）項目數量。
    Task<int> ConfirmForUserAsync(
        Guid userId,
        IReadOnlyCollection<Guid> workItemIds,
        CancellationToken cancellationToken);
}
