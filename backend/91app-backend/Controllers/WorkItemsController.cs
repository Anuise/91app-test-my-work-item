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
    [ProducesResponseType<ApiResponse<PagedWorkItems>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWorkItems(
        [FromQuery] string sortBy = "createdAt",
        [FromQuery] string sortOrder = "desc",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        // ADR 0015：sortBy／sortOrder 白名單外的值靜默 fallback 回預設（createdAt / desc），不回 400。
        var sortField = string.Equals(sortBy, "title", StringComparison.OrdinalIgnoreCase)
            ? WorkItemSortField.Title
            : WorkItemSortField.CreatedAt;
        var order = string.Equals(sortOrder, "asc", StringComparison.OrdinalIgnoreCase)
            ? WorkItemSortOrder.Ascending
            : WorkItemSortOrder.Descending;

        // 分頁參數防禦性夾限：page 至少為 1、pageSize 非正值時回退預設 20，避免非法 Skip/Take。
        if (page < 1)
        {
            page = 1;
        }

        if (pageSize < 1)
        {
            pageSize = 20;
        }

        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(subject, out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail(
                "登入狀態無效",
                ["Token identity claims are incomplete"],
                HttpContext.TraceIdentifier));
        }

        var result = await workItemService.GetWorkItemsForUserAsync(userId, sortField, order, page, pageSize, cancellationToken);
        return Ok(ApiResponse<PagedWorkItems>.Ok(result, "取得工作項目列表成功"));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<ApiResponse<WorkItemDetail>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWorkItem(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(subject, out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail(
                "登入狀態無效",
                ["Token identity claims are incomplete"],
                HttpContext.TraceIdentifier));
        }

        var detail = await workItemService.GetDetailForUserAsync(userId, id, cancellationToken);
        if (detail is null)
        {
            // 詳情只回傳 active Work Item；不存在或已刪除時回傳一致的錯誤 envelope。
            return NotFound(ApiResponse<object>.Fail(
                "找不到工作項目",
                ["Work item not found"],
                HttpContext.TraceIdentifier));
        }

        return Ok(ApiResponse<WorkItemDetail>.Ok(detail, "取得工作項目詳情成功"));
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

    [HttpPost("{id:guid}/revoke")]
    [ProducesResponseType<ApiResponse<RevokeResult>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiResponse<object>>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Revoke(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!Guid.TryParse(subject, out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail(
                "登入狀態無效",
                ["Token identity claims are incomplete"],
                HttpContext.TraceIdentifier));
        }

        var result = await workItemService.RevokeAsync(userId, id, cancellationToken);

        // 依 ADR 0013 優雅降級：無法撤銷（已刪除或非 Confirmed）時仍以 HTTP 200 回應並於訊息說明。
        var message = result.Revoked
            ? "已撤銷確認，狀態恢復為待確認"
            : "此項目目前非已確認狀態，無需撤銷";
        return Ok(ApiResponse<RevokeResult>.Ok(result, message));
    }
}
