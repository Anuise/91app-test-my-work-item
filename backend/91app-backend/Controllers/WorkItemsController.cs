using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using _91app_backend.Contracts;
using _91app_backend.Responses;
using _91app_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace _91app_backend.Controllers;

[ApiController]
[Route("api/v1/work-items")]
[Authorize]
public sealed class WorkItemsController(IWorkItemService workItemService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<ApiResponse<IReadOnlyList<WorkItemListItem>>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWorkItems(
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc",
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(sortBy, "createdAt", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(ApiResponse<object>.Fail(
                "排序欄位不正確",
                ["sortBy 僅支援 createdAt"],
                HttpContext.TraceIdentifier));
        }

        WorkItemSortOrder order;
        if (string.Equals(sortOrder, "asc", StringComparison.OrdinalIgnoreCase))
        {
            order = WorkItemSortOrder.Ascending;
        }
        else if (string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase))
        {
            order = WorkItemSortOrder.Descending;
        }
        else
        {
            return BadRequest(ApiResponse<object>.Fail(
                "排序方向不正確",
                ["sortOrder 僅支援 asc 或 desc"],
                HttpContext.TraceIdentifier));
        }

        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(subject, out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail(
                "登入狀態無效",
                ["Token identity claims are incomplete"],
                HttpContext.TraceIdentifier));
        }

        var items = await workItemService.GetWorkItemsForUserAsync(userId, order, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<WorkItemListItem>>.Ok(items, "取得工作項目列表成功"));
    }

    [HttpPost("bulk-confirm")]
    [ProducesResponseType<ApiResponse<BulkConfirmResult>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> BulkConfirm(
        BulkConfirmRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.WorkItemIds is null || request.WorkItemIds.Count == 0)
        {
            return BadRequest(ApiResponse<object>.Fail(
                "請至少選擇一個工作項目",
                ["workItemIds 不可為空"],
                HttpContext.TraceIdentifier));
        }

        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(subject, out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail(
                "登入狀態無效",
                ["Token identity claims are incomplete"],
                HttpContext.TraceIdentifier));
        }

        var result = await workItemService.BulkConfirmAsync(userId, request.WorkItemIds, cancellationToken);

        // 依 ADR 0013：即使部分項目已被移除仍以 HTTP 200 回應，並於訊息回饋實際確認數量。
        var message = result.IgnoredCount > 0
            ? $"成功確認 {result.ConfirmedCount} 個項目，{result.IgnoredCount} 個項目已被移除"
            : $"成功確認 {result.ConfirmedCount} 個項目";
        return Ok(ApiResponse<BulkConfirmResult>.Ok(result, message));
    }
}
