using _91app_backend.Contracts;
using _91app_backend.Data;
using _91app_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace _91app_backend.Repositories;

public sealed class WorkItemRepository(AppDbContext context) : IWorkItemRepository
{
    public async Task<IReadOnlyList<AdminWorkItemListItem>> GetAdminWorkItemsAsync(
        CancellationToken cancellationToken) =>
        await context.WorkItems
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .Select(item => new AdminWorkItemListItem(
                item.Id,
                item.Title,
                item.Description,
                item.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<CreatedWorkItem> CreateAsync(
        string title,
        string? description,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var workItem = new WorkItem
        {
            Id = Guid.NewGuid(),
            Title = title,
            Description = description,
            CreatedAt = now,
            UpdatedAt = now
        };
        context.WorkItems.Add(workItem);
        await context.SaveChangesAsync(cancellationToken);
        return new CreatedWorkItem(workItem.Id, workItem.Title, workItem.Description, workItem.CreatedAt);
    }

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

    public async Task<WorkItemDetail?> GetDetailForUserAsync(
        Guid userId,
        Guid workItemId,
        CancellationToken cancellationToken)
    {
        // ADR 0005：以 LEFT JOIN 取得個人化狀態；無紀錄者於投影隱式視為 Pending。
        // 已軟刪除項目未來將由 Global Query Filter 自動排除（ADR 0013），此處以存在與否作為 active 判定。
        return await (
                from workItem in context.WorkItems
                where workItem.Id == workItemId
                join status in context.UserWorkItemStatuses
                    on workItem.Id equals status.WorkItemId into statusGroup
                from status in statusGroup.Where(item => item.UserId == userId).DefaultIfEmpty()
                select new WorkItemDetail(
                    workItem.Id,
                    workItem.Title,
                    workItem.Description,
                    status != null && status.Status == WorkItemStatus.Confirmed
                        ? WorkItemStatus.Confirmed
                        : WorkItemStatus.Pending,
                    workItem.CreatedAt,
                    workItem.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<int> ConfirmForUserAsync(
        Guid userId,
        IReadOnlyCollection<Guid> workItemIds,
        CancellationToken cancellationToken)
    {
        // 僅針對目前仍存在的 Work Item 確認；已刪除或不存在的 ID 於此自動被過濾（ADR 0013）。
        var existingIds = await context.WorkItems
            .Where(item => workItemIds.Contains(item.Id))
            .Select(item => item.Id)
            .ToListAsync(cancellationToken);

        if (existingIds.Count == 0)
        {
            return 0;
        }

        var now = DateTimeOffset.UtcNow;
        var existingStatuses = await context.UserWorkItemStatuses
            .Where(status => status.UserId == userId && existingIds.Contains(status.WorkItemId))
            .ToDictionaryAsync(status => status.WorkItemId, cancellationToken);

        foreach (var workItemId in existingIds)
        {
            if (existingStatuses.TryGetValue(workItemId, out var status))
            {
                // 冪等：已確認者僅更新時間戳，尚未確認者轉為 Confirmed 並記錄首次確認時間。
                if (status.Status != WorkItemStatus.Confirmed)
                {
                    status.Status = WorkItemStatus.Confirmed;
                    status.ConfirmedAt = now;
                }

                status.UpdatedAt = now;
            }
            else
            {
                context.UserWorkItemStatuses.Add(new UserWorkItemStatus
                {
                    UserId = userId,
                    WorkItemId = workItemId,
                    Status = WorkItemStatus.Confirmed,
                    ConfirmedAt = now,
                    UpdatedAt = now
                });
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        return existingIds.Count;
    }

    public async Task<bool> RevokeForUserAsync(
        Guid userId,
        Guid workItemId,
        CancellationToken cancellationToken)
    {
        // 僅撤銷仍存在（未軟刪除）的 Work Item；已刪除者透過 Global Query Filter 自動排除（ADR 0013）。
        var exists = await context.WorkItems
            .AnyAsync(item => item.Id == workItemId, cancellationToken);
        if (!exists)
        {
            return false;
        }

        var status = await context.UserWorkItemStatuses
            .FirstOrDefaultAsync(
                item => item.UserId == userId && item.WorkItemId == workItemId,
                cancellationToken);

        // 服務轉換規則：僅 Confirmed 可撤銷回 Pending；隱式 Pending（無紀錄）或已是 Pending 皆視為無需變更（冪等）。
        if (status is null || status.Status != WorkItemStatus.Confirmed)
        {
            return false;
        }

        status.Status = WorkItemStatus.Pending;
        status.ConfirmedAt = null;
        status.UpdatedAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
