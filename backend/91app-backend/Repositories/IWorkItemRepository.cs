using _91app_backend.Contracts;

namespace _91app_backend.Repositories;

public interface IWorkItemRepository
{
    Task<IReadOnlyList<WorkItemListItem>> GetWorkItemsForUserAsync(
        Guid userId,
        WorkItemSortOrder sortOrder,
        CancellationToken cancellationToken);
}
