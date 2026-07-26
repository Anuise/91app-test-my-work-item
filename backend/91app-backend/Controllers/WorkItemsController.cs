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
}
