using _91app_backend.Contracts;
using _91app_backend.Data;
using _91app_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace _91app_backend.Repositories;

public sealed class WorkItemRepository(AppDbContext context) : IWorkItemRepository
{
    public async Task<IReadOnlyList<WorkItemListItem>> GetWorkItemsForUserAsync(
        Guid userId,
        WorkItemSortOrder sortOrder,
        CancellationToken cancellationToken)
    {
        // ADR 0005：以 LEFT JOIN 取得使用者個人化狀態，未建立紀錄者於下方投影隱式視為 Pending。
        var joined =
            from workItem in context.WorkItems
            join status in context.UserWorkItemStatuses
                on workItem.Id equals status.WorkItemId into statusGroup
            from status in statusGroup.Where(item => item.UserId == userId).DefaultIfEmpty()
            select new { workItem, status };

        // 以 Id 作為次要排序鍵，避免 CreatedAt 相同時排序不穩定。
        joined = sortOrder == WorkItemSortOrder.Ascending
            ? joined.OrderBy(item => item.workItem.CreatedAt).ThenBy(item => item.workItem.Id)
            : joined.OrderByDescending(item => item.workItem.CreatedAt).ThenByDescending(item => item.workItem.Id);

        return await joined
            .Select(item => new WorkItemListItem(
                item.workItem.Id,
                item.workItem.Title,
                item.status != null && item.status.Status == WorkItemStatus.Confirmed
                    ? WorkItemStatus.Confirmed
                    : WorkItemStatus.Pending,
                item.workItem.CreatedAt))
            .ToListAsync(cancellationToken);
    }
}
