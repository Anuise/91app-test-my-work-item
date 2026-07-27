using _91app_backend.Contracts;

namespace _91app_backend.Services;

public interface IWorkItemService
{
    Task<IReadOnlyList<WorkItemListItem>> GetWorkItemsForUserAsync(
        Guid userId,
        WorkItemSortOrder sortOrder,
        CancellationToken cancellationToken);

    Task<BulkConfirmResult> BulkConfirmAsync(
        Guid userId,
        IReadOnlyList<Guid> workItemIds,
        CancellationToken cancellationToken);

    Task<RevokeResult> RevokeAsync(
        Guid userId,
        Guid workItemId,
        CancellationToken cancellationToken);
}
