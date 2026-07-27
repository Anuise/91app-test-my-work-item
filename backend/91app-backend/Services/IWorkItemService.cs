using _91app_backend.Contracts;

namespace _91app_backend.Services;

public interface IWorkItemService
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

    Task<PagedWorkItems> GetWorkItemsForUserAsync(
        Guid userId,
        WorkItemSortField sortField,
        WorkItemSortOrder sortOrder,
        int page,
        int pageSize,
        CancellationToken cancellationToken);

    Task<WorkItemDetail?> GetDetailForUserAsync(
        Guid userId,
        Guid workItemId,
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
