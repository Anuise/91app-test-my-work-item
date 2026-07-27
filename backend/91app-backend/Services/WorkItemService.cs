using _91app_backend.Contracts;
using _91app_backend.Repositories;

namespace _91app_backend.Services;

public sealed class WorkItemService(IWorkItemRepository workItemRepository) : IWorkItemService
{
    public Task<IReadOnlyList<WorkItemListItem>> GetWorkItemsForUserAsync(
        Guid userId,
        WorkItemSortOrder sortOrder,
        CancellationToken cancellationToken) =>
        workItemRepository.GetWorkItemsForUserAsync(userId, sortOrder, cancellationToken);

    public Task<WorkItemDetail?> GetDetailForUserAsync(
        Guid userId,
        Guid workItemId,
        CancellationToken cancellationToken) =>
        workItemRepository.GetDetailForUserAsync(userId, workItemId, cancellationToken);

    public async Task<BulkConfirmResult> BulkConfirmAsync(
        Guid userId,
        IReadOnlyList<Guid> workItemIds,
        CancellationToken cancellationToken)
    {
        // 去除重複 ID，避免同一項目被重複計數。
        var distinctIds = workItemIds.Distinct().ToList();
        var confirmedCount = await workItemRepository.ConfirmForUserAsync(userId, distinctIds, cancellationToken);
        var ignoredCount = distinctIds.Count - confirmedCount;
        return new BulkConfirmResult(confirmedCount, ignoredCount);
    }

    public async Task<RevokeResult> RevokeAsync(
        Guid userId,
        Guid workItemId,
        CancellationToken cancellationToken)
    {
        var revoked = await workItemRepository.RevokeForUserAsync(userId, workItemId, cancellationToken);
        return new RevokeResult(revoked);
    }
}
