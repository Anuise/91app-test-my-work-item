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
}
